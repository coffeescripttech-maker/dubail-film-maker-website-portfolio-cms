import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchUpdateProjectOrder } from '@/lib/d1-client';

// PUT /api/projects/reorder - Batch update film order
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    // Validation
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ 
        error: 'Invalid request body. Expected { updates: Array<{ projectId: string, orderIndex: number }> }' 
      }, { status: 400 });
    }

    if (updates.length === 0) {
      return NextResponse.json({ 
        error: 'Updates array cannot be empty' 
      }, { status: 400 });
    }

    // Validate each update object
    for (const update of updates) {
      if (!update.projectId || typeof update.projectId !== 'string') {
        return NextResponse.json({ 
          error: 'Each update must have a valid projectId (string)' 
        }, { status: 400 });
      }
      if (update.orderIndex === undefined || typeof update.orderIndex !== 'number') {
        return NextResponse.json({ 
          error: 'Each update must have a valid orderIndex (number)' 
        }, { status: 400 });
      }
    }

    // Check for duplicate project IDs
    const projectIds = updates.map(u => u.projectId);
    const uniqueIds = new Set(projectIds);
    if (projectIds.length !== uniqueIds.size) {
      return NextResponse.json({ 
        error: 'Duplicate project IDs found in updates array' 
      }, { status: 400 });
    }

    // Perform batch update
    const updatedProjects = await batchUpdateProjectOrder(updates);

    return NextResponse.json({
      success: true,
      projects: updatedProjects,
      count: updatedProjects.length
    });
  } catch (error) {
    console.error('Error reordering projects:', error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('Projects not found')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Failed to reorder projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
