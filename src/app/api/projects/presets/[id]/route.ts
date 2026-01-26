import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFilmPresetById, deleteFilmPreset } from '@/lib/d1-client';

// DELETE /api/projects/presets/:id - Delete preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if preset exists
    const preset = await getFilmPresetById(id);
    if (!preset) {
      return NextResponse.json({ 
        error: 'Preset not found' 
      }, { status: 404 });
    }

    // Delete preset
    const success = await deleteFilmPreset(id);

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to delete preset' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting film preset:', error);
    
    return NextResponse.json({ 
      error: 'Failed to delete preset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
