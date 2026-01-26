import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/r2-storage';
import { saveThumbnailMetadata } from '@/lib/thumbnail-service';
import {
  resizeImage,
  compressImage,
  generateResponsiveSizes,
  convertToWebP,
  generateResponsiveWebP,
  getImageMetadata,
  isValidImage,
  RESPONSIVE_SIZES,
} from '@/lib/image-optimization';

// Thumbnail-specific constants
const THUMBNAIL_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_THUMBNAIL_SIZE_MB = 10;
const MAX_THUMBNAIL_SIZE_BYTES = MAX_THUMBNAIL_SIZE_MB * 1024 * 1024;
const OPTIMIZATION_QUALITY = 85;

// Validate file type for thumbnails
function validateThumbnailType(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return THUMBNAIL_TYPES.includes(extension || '');
}

// Validate file size
function validateThumbnailSize(fileSize: number): boolean {
  return fileSize <= MAX_THUMBNAIL_SIZE_BYTES;
}

// Get file extension from filename
function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || 'jpg';
}

/**
 * POST /api/thumbnails/process
 * 
 * Process and upload a thumbnail with full optimization pipeline:
 * 1. Validate file type and size
 * 2. Optimize dimensions (max 1920x1080)
 * 3. Compress image
 * 4. Generate responsive sizes (small, medium, large)
 * 5. Generate WebP versions for each size
 * 6. Upload all variants to R2
 * 7. Save metadata to database
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string;
    const setAsActive = formData.get('set_as_active') !== 'false'; // default true

    // Validate required fields
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided' 
      }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required' 
      }, { status: 400 });
    }

    // Validate file type
    if (!validateThumbnailType(file.name)) {
      return NextResponse.json({ 
        error: `Invalid file type. Please upload JPEG, PNG, or WebP images.` 
      }, { status: 400 });
    }

    // Validate file size
    if (!validateThumbnailSize(file.size)) {
      return NextResponse.json({ 
        error: `File exceeds maximum size of ${MAX_THUMBNAIL_SIZE_MB}MB.` 
      }, { status: 413 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Validate that it's a valid image
    if (!(await isValidImage(buffer))) {
      return NextResponse.json({ 
        error: 'Invalid image file' 
      }, { status: 400 });
    }

    // Get original image metadata
    const originalMetadata = await getImageMetadata(buffer);
    console.log('Original image metadata:', originalMetadata);

    // Step 1: Resize to maximum dimensions if needed (1920x1080)
    let optimizedBuffer = buffer;
    if (originalMetadata.width > RESPONSIVE_SIZES.large.width || 
        originalMetadata.height > RESPONSIVE_SIZES.large.height) {
      console.log('Resizing image to fit within 1920x1080...');
      const resized = await resizeImage(
        buffer, 
        RESPONSIVE_SIZES.large.width, 
        RESPONSIVE_SIZES.large.height
      );
      optimizedBuffer = Buffer.from(resized.buffer);
    }

    // Step 2: Compress the main image
    console.log('Compressing main image...');
    const compressed = await compressImage(optimizedBuffer, OPTIMIZATION_QUALITY);
    
    // Step 3: Generate responsive sizes (small, medium, large)
    console.log('Generating responsive sizes...');
    const responsiveSizes = await generateResponsiveSizes(compressed.buffer, OPTIMIZATION_QUALITY);

    // Step 4: Generate WebP versions for all sizes
    console.log('Generating WebP versions...');
    const webpSizes = await generateResponsiveWebP(compressed.buffer, OPTIMIZATION_QUALITY);

    // Step 5: Upload all variants to R2
    console.log('Uploading all variants to R2...');
    const timestamp = Date.now();
    const baseFileName = file.name.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9-_]/g, '-');
    const originalExtension = getFileExtension(file.name);

    const uploadPromises = [];
    const uploadedUrls: Record<string, string> = {};

    // Upload original format sizes
    for (const [sizeName, sizeData] of Object.entries(responsiveSizes)) {
      const key = `thumbnails/custom/${projectId}/${timestamp}-${baseFileName}-${sizeName}.${originalExtension}`;
      uploadPromises.push(
        uploadFile(sizeData.buffer, `${baseFileName}-${sizeName}.${originalExtension}`, {
          fileName: key,
          contentType: `image/${originalExtension === 'jpg' ? 'jpeg' : originalExtension}`,
        }).then(result => {
          uploadedUrls[`${sizeName}_${originalExtension}`] = result.publicUrl;
        })
      );
    }

    // Upload WebP versions
    for (const [sizeName, sizeData] of Object.entries(webpSizes)) {
      const key = `thumbnails/custom/${projectId}/${timestamp}-${baseFileName}-${sizeName}.webp`;
      uploadPromises.push(
        uploadFile(sizeData.buffer, `${baseFileName}-${sizeName}.webp`, {
          fileName: key,
          contentType: 'image/webp',
        }).then(result => {
          uploadedUrls[`${sizeName}_webp`] = result.publicUrl;
        })
      );
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    console.log('All variants uploaded successfully');

    // Step 6: Save metadata to database
    // Use the large size as the primary thumbnail URL
    const primaryThumbnailUrl = uploadedUrls[`large_${originalExtension}`] || uploadedUrls['large_webp'];

    const thumbnailMetadata = {
      width: responsiveSizes.large.width,
      height: responsiveSizes.large.height,
      size: responsiveSizes.large.size,
      formats: [originalExtension, 'webp'],
      variants: {
        small: {
          [originalExtension]: uploadedUrls[`small_${originalExtension}`],
          webp: uploadedUrls['small_webp'],
          width: responsiveSizes.small.width,
          height: responsiveSizes.small.height,
        },
        medium: {
          [originalExtension]: uploadedUrls[`medium_${originalExtension}`],
          webp: uploadedUrls['medium_webp'],
          width: responsiveSizes.medium.width,
          height: responsiveSizes.medium.height,
        },
        large: {
          [originalExtension]: uploadedUrls[`large_${originalExtension}`],
          webp: uploadedUrls['large_webp'],
          width: responsiveSizes.large.width,
          height: responsiveSizes.large.height,
        },
      },
    };

    const savedThumbnail = await saveThumbnailMetadata(
      projectId,
      {
        thumbnail_url: primaryThumbnailUrl,
        thumbnail_type: 'custom',
        metadata: thumbnailMetadata,
      },
      setAsActive
    );

    console.log('Thumbnail metadata saved to database');

    // Return success response with all URLs
    return NextResponse.json({
      success: true,
      thumbnail: savedThumbnail,
      urls: uploadedUrls,
      metadata: thumbnailMetadata,
      message: 'Thumbnail processed and uploaded successfully',
    });

  } catch (error) {
    console.error('Thumbnail processing error:', error);
    return NextResponse.json({ 
      error: 'Processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
