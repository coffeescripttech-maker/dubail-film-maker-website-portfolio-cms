import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFilmPresetById, batchUpdateProjectOrder } from '@/lib/d1-client';

// PUT /api/projects/presets/:id/apply - Apply preset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get preset
    const preset = await getFilmPresetById(id);
    if (!preset) {
      return NextResponse.json({ 
        error: 'Preset not found' 
      }, { status: 404 });
    }

    // Validate order config
    if (!preset.order_config || preset.order_config.length === 0) {
      return NextResponse.json({ 
        error: 'Preset has no order configuration' 
      }, { status: 400 });
    }

    // Apply the preset by updating project order
    const updatedProjects = await batchUpdateProjectOrder(preset.order_config);

    return NextResponse.json({
      success: true,
      preset: {
        id: preset.id,
        name: preset.name,
        description: preset.description
      },
      projects: updatedProjects,
      count: updatedProjects.length
    });
  } catch (error) {
    console.error('Error applying film preset:', error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('Projects not found')) {
      return NextResponse.json({ 
        error: 'Some projects in the preset no longer exist',
        details: error.message
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Failed to apply preset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
