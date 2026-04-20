import { NextRequest, NextResponse } from 'next/server';
import { saveThumbnailMetadata, getThumbnailOptions, setActiveThumbnail, deleteThumbnail } from '@/lib/thumbnail-service';

// GET /api/projects/[id]/thumbnails - Get all thumbnails for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const thumbnails = await getThumbnailOptions(projectId);
    
    return NextResponse.json({ thumbnails }, { status: 200 });
  } catch (error) {
    console.error('Error fetching thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thumbnails' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/thumbnails - Save a new thumbnail
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    
    const { thumbnail_url, thumbnail_type, timestamp, metadata, setAsActive = true } = body;
    
    if (!thumbnail_url || !thumbnail_type) {
      return NextResponse.json(
        { error: 'Missing required fields: thumbnail_url, thumbnail_type' },
        { status: 400 }
      );
    }
    
    const thumbnail = await saveThumbnailMetadata(
      projectId,
      {
        thumbnail_url,
        thumbnail_type,
        timestamp,
        metadata
      },
      setAsActive
    );
    
    return NextResponse.json({ thumbnail }, { status: 201 });
  } catch (error) {
    console.error('Error saving thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to save thumbnail' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/thumbnails/[thumbnailId] - Set active thumbnail
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { thumbnailId } = body;
    
    if (!thumbnailId) {
      return NextResponse.json(
        { error: 'Missing required field: thumbnailId' },
        { status: 400 }
      );
    }
    
    const thumbnail = await setActiveThumbnail(thumbnailId);
    
    if (!thumbnail) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ thumbnail }, { status: 200 });
  } catch (error) {
    console.error('Error setting active thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to set active thumbnail' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/thumbnails/[thumbnailId] - Delete a thumbnail
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const thumbnailId = searchParams.get('thumbnailId');
    
    if (!thumbnailId) {
      return NextResponse.json(
        { error: 'Missing required parameter: thumbnailId' },
        { status: 400 }
      );
    }
    
    const success = await deleteThumbnail(thumbnailId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete thumbnail' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to delete thumbnail' },
      { status: 500 }
    );
  }
}
