import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setActiveThumbnail } from '@/lib/thumbnail-service';

/**
 * POST /api/thumbnails/[id]/activate
 * 
 * Set a thumbnail as the active thumbnail for a project
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ 
        error: 'Thumbnail ID is required' 
      }, { status: 400 });
    }

    // Set thumbnail as active
    const updatedThumbnail = await setActiveThumbnail(id);

    if (!updatedThumbnail) {
      return NextResponse.json({ 
        error: 'Thumbnail not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedThumbnail
    });

  } catch (error) {
    console.error('Error activating thumbnail:', error);
    return NextResponse.json({ 
      error: 'Failed to activate thumbnail', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
