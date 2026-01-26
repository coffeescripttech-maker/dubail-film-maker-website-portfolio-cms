// About Images Reorder API
// POST: Batch update order_index for multiple images

import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1-client';

interface ReorderItem {
  id: string;
  order_index: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images } = body as { images: ReorderItem[] };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 }
      );
    }

    // Validate all image IDs exist
    const imageIds = images.map(img => img.id);
    const placeholders = imageIds.map(() => '?').join(',');
    const existingResult = await queryD1(
      `SELECT id FROM about_images WHERE id IN (${placeholders})`,
      imageIds
    );

    const existingIds = new Set(existingResult.results.map((row: any) => row.id));
    const missingIds = imageIds.filter(id => !existingIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Images not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Perform batch update
    for (const image of images) {
      await queryD1(
        'UPDATE about_images SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [image.order_index, image.id]
      );
    }

    // Return updated images
    const updatedResult = await queryD1(
      `SELECT * FROM about_images WHERE id IN (${placeholders}) ORDER BY order_index ASC`,
      imageIds
    );

    if (updatedResult && updatedResult.results) {
      return NextResponse.json({ images: updatedResult.results });
    }

    return NextResponse.json({ images: [] });
  } catch (error) {
    console.error('Error reordering about images:', error);
    return NextResponse.json(
      { error: 'Failed to reorder about images' },
      { status: 500 }
    );
  }
}
