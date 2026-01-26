import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/video/extract-frame
 * 
 * This endpoint validates video frame extraction requests.
 * The actual frame extraction happens client-side using Canvas API.
 * 
 * Requirements: 2.4 - Extract frame at timestamp
 */

interface ExtractFrameRequest {
  videoUrl: string;
  timestamp: number;
  videoDuration?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExtractFrameRequest = await request.json();
    const { videoUrl, timestamp, videoDuration } = body;

    // Validate required fields
    if (!videoUrl) {
      return NextResponse.json({ 
        error: 'Video URL is required' 
      }, { status: 400 });
    }

    if (timestamp === undefined || timestamp === null) {
      return NextResponse.json({ 
        error: 'Timestamp is required' 
      }, { status: 400 });
    }

    // Validate timestamp is non-negative
    if (timestamp < 0) {
      return NextResponse.json({ 
        error: 'Timestamp must be greater than or equal to 0' 
      }, { status: 400 });
    }

    // If video duration is provided, validate timestamp is within duration
    if (videoDuration !== undefined && timestamp > videoDuration) {
      return NextResponse.json({ 
        error: `Timestamp must be between 0 and video duration (${videoDuration}s)` 
      }, { status: 400 });
    }

    // Validate video URL format
    try {
      new URL(videoUrl);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid video URL format' 
      }, { status: 400 });
    }

    // Return success with extraction instructions
    // The client will use Canvas API to extract the frame
    return NextResponse.json({
      success: true,
      message: 'Frame extraction validated',
      data: {
        videoUrl,
        timestamp,
        instructions: {
          method: 'canvas',
          steps: [
            'Load video element with provided URL',
            'Seek to specified timestamp',
            'Draw current frame to canvas',
            'Export canvas as image blob'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Video frame extraction validation error:', error);
    return NextResponse.json({ 
      error: 'Frame extraction validation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
