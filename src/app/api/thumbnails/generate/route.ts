import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectById } from '@/lib/d1-client';
import { uploadFile } from '@/lib/r2-storage';
import { saveThumbnailMetadata } from '@/lib/thumbnail-service';
import {
  generateResponsiveSizes,
  generateResponsiveWebP,
  getImageMetadata,
  isValidImage,
} from '@/lib/image-optimization';

/**
 * POST /api/thumbnails/generate
 * 
 * Accepts a captured video frame and uploads it as a thumbnail.
 * The frame extraction happens client-side, and this endpoint handles
 * the upload and persistence.
 * 
 * Requirements: 2.5, 2.6 - Upload frame to R2 and save metadata with timestamp
 */

interface GenerateThumbnailRequest {
  projectId: string;
  timestamp: number;
  frameData: string; // Base64 encoded image data
  width?: number;
  height?: number;
}

// Convert base64 to Buffer
function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(base64Data, 'base64');
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateThumbnailRequest = await request.json();
    const { projectId, timestamp, frameData, width, height } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required' 
      }, { status: 400 });
    }

    if (timestamp === undefined || timestamp === null) {
      return NextResponse.json({ 
        error: 'Timestamp is required' 
      }, { status: 400 });
    }

    if (!frameData) {
      return NextResponse.json({ 
        error: 'Frame data is required' 
      }, { status: 400 });
    }

    // Validate timestamp is non-negative
    if (timestamp < 0) {
      return NextResponse.json({ 
        error: 'Timestamp must be greater than or equal to 0' 
      }, { status: 400 });
    }

    // Verify project exists and has a video
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found' 
      }, { status: 404 });
    }

    if (!project.video_url) {
      return NextResponse.json({ 
        error: 'Project does not have a video' 
      }, { status: 400 });
    }

    // Convert base64 frame data to buffer
    let frameBuffer: Buffer;
    try {
      frameBuffer = base64ToBuffer(frameData);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid frame data format' 
      }, { status: 400 });
    }

    // Validate that it's a valid image
    if (!(await isValidImage(frameBuffer))) {
      return NextResponse.json({ 
        error: 'Invalid image data' 
      }, { status: 400 });
    }

    // Get original frame metadata
    const originalMetadata = await getImageMetadata(frameBuffer);
    console.log('Video frame metadata:', originalMetadata);

    // Generate responsive sizes and WebP versions
    console.log('Generating responsive sizes for video frame...');
    const responsiveSizes = await generateResponsiveSizes(frameBuffer, 85);
    const webpSizes = await generateResponsiveWebP(frameBuffer, 85);

    // Upload all variants to R2
    const timestampFormatted = timestamp.toFixed(2).replace('.', '_');
    const uploadPromises = [];
    const uploadedUrls: Record<string, string> = {};

    // Upload JPEG versions
    for (const [sizeName, sizeData] of Object.entries(responsiveSizes)) {
      const key = `thumbnails/video-frames/${projectId}/frame-${timestampFormatted}s-${sizeName}.jpg`;
      uploadPromises.push(
        uploadFile(sizeData.buffer, `frame-${timestampFormatted}s-${sizeName}.jpg`, {
          fileName: key,
          contentType: 'image/jpeg',
          metadata: {
            projectId,
            timestamp: timestamp.toString(),
            type: 'video_frame',
            size: sizeName,
          }
        }).then(result => {
          uploadedUrls[`${sizeName}_jpg`] = result.publicUrl;
        })
      );
    }

    // Upload WebP versions
    for (const [sizeName, sizeData] of Object.entries(webpSizes)) {
      const key = `thumbnails/video-frames/${projectId}/frame-${timestampFormatted}s-${sizeName}.webp`;
      uploadPromises.push(
        uploadFile(sizeData.buffer, `frame-${timestampFormatted}s-${sizeName}.webp`, {
          fileName: key,
          contentType: 'image/webp',
          metadata: {
            projectId,
            timestamp: timestamp.toString(),
            type: 'video_frame',
            size: sizeName,
          }
        }).then(result => {
          uploadedUrls[`${sizeName}_webp`] = result.publicUrl;
        })
      );
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    console.log('All video frame variants uploaded successfully');

    // Use the large JPEG as the primary thumbnail URL
    const primaryThumbnailUrl = uploadedUrls['large_jpg'];

    // Prepare metadata with all variants
    const thumbnailMetadata = {
      width: responsiveSizes.large.width,
      height: responsiveSizes.large.height,
      size: responsiveSizes.large.size,
      formats: ['jpg', 'webp'],
      variants: {
        small: {
          jpg: uploadedUrls['small_jpg'],
          webp: uploadedUrls['small_webp'],
          width: responsiveSizes.small.width,
          height: responsiveSizes.small.height,
        },
        medium: {
          jpg: uploadedUrls['medium_jpg'],
          webp: uploadedUrls['medium_webp'],
          width: responsiveSizes.medium.width,
          height: responsiveSizes.medium.height,
        },
        large: {
          jpg: uploadedUrls['large_jpg'],
          webp: uploadedUrls['large_webp'],
          width: responsiveSizes.large.width,
          height: responsiveSizes.large.height,
        },
      },
    };

    // Save thumbnail metadata to database
    const thumbnailOption = await saveThumbnailMetadata(
      projectId,
      {
        thumbnail_url: primaryThumbnailUrl,
        thumbnail_type: 'video_frame',
        timestamp,
        metadata: thumbnailMetadata,
      },
      true // Set as active by default
    );

    // Return success with thumbnail URL and all variants
    return NextResponse.json({
      success: true,
      message: 'Video frame thumbnail generated successfully',
      data: {
        thumbnailUrl: primaryThumbnailUrl,
        thumbnailId: thumbnailOption.id,
        timestamp,
        urls: uploadedUrls,
        metadata: thumbnailMetadata,
      }
    });

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json({ 
      error: 'Thumbnail generation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
