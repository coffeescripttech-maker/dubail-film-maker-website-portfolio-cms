import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/r2-storage';

// Thumbnail-specific constants
const THUMBNAIL_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_THUMBNAIL_SIZE_MB = 10;
const MAX_THUMBNAIL_SIZE_BYTES = MAX_THUMBNAIL_SIZE_MB * 1024 * 1024;

// Validate file type for thumbnails
function validateThumbnailType(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return THUMBNAIL_TYPES.includes(extension || '');
}

// Validate file size
function validateThumbnailSize(fileSize: number): boolean {
  return fileSize <= MAX_THUMBNAIL_SIZE_BYTES;
}

// Get content type from file extension
function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

// Generate unique storage key for thumbnail
function generateThumbnailKey(projectId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop()?.toLowerCase();
  const sanitizedName = fileName
    .split('.')
    .slice(0, -1)
    .join('.')
    .replace(/[^a-zA-Z0-9-_]/g, '-');
  
  return `thumbnails/custom/${projectId}/${timestamp}-${sanitizedName}.${extension}`;
}

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

    // Generate unique storage key with timestamp
    const storageKey = generateThumbnailKey(projectId, file.name);
    const contentType = getContentType(file.name);

    // Get presigned URL from R2
    const presignedUrl = await generatePresignedUploadUrl(storageKey, contentType);

    // Generate public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${storageKey}`;

    // Return presigned URL and metadata to client
    return NextResponse.json({
      success: true,
      presignedUrl,
      metadata: {
        key: storageKey,
        publicUrl,
        contentType,
        size: file.size,
        originalName: file.name,
        projectId,
      }
    });

  } catch (error) {
    console.error('Thumbnail upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
