import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createFilmPreset, getAllFilmPresets } from '@/lib/d1-client';

// POST /api/projects/presets - Save new preset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, orderConfig } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Preset name is required and must be a non-empty string' 
      }, { status: 400 });
    }

    if (!orderConfig || !Array.isArray(orderConfig)) {
      return NextResponse.json({ 
        error: 'Invalid orderConfig. Expected array of { projectId: string, orderIndex: number }' 
      }, { status: 400 });
    }

    if (orderConfig.length === 0) {
      return NextResponse.json({ 
        error: 'orderConfig array cannot be empty' 
      }, { status: 400 });
    }

    // Validate each order config item
    for (const item of orderConfig) {
      if (!item.projectId || typeof item.projectId !== 'string') {
        return NextResponse.json({ 
          error: 'Each orderConfig item must have a valid projectId (string)' 
        }, { status: 400 });
      }
      if (item.orderIndex === undefined || typeof item.orderIndex !== 'number') {
        return NextResponse.json({ 
          error: 'Each orderConfig item must have a valid orderIndex (number)' 
        }, { status: 400 });
      }
    }

    // Create preset
    const preset = await createFilmPreset(
      name.trim(),
      description?.trim(),
      orderConfig
    );

    return NextResponse.json({
      success: true,
      preset
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating film preset:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create preset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/projects/presets - List all presets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const presets = await getAllFilmPresets();

    return NextResponse.json({
      success: true,
      presets,
      count: presets.length
    });
  } catch (error) {
    console.error('Error fetching film presets:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch presets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
