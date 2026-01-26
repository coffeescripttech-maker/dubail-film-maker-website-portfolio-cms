import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteThumbnail } from '@/lib/thumbnail-service';

/**
 * DELETE /api/thumbnails/[id]
 * 
 * Delete a thumbnail option
 */
export async function DELETE(
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

    // Delete thumbnail
    const success = await deleteThumbnail(id);

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to delete thumbnail' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thumbnail deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting thumbnail:', error);
    return NextResponse.json({ 
      error: 'Failed to delete thumbnail', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
