import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getThumbnailOptions } from '@/lib/thumbnail-service';

/**
 * GET /api/thumbnails/options/[projectId]
 * 
 * Get all thumbnail options for a project
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required' 
      }, { status: 400 });
    }

    // Get thumbnail options from database
    const thumbnailOptions = await getThumbnailOptions(projectId);

    return NextResponse.json({
      success: true,
      data: thumbnailOptions
    });

  } catch (error) {
    console.error('Error fetching thumbnail options:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch thumbnail options', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
