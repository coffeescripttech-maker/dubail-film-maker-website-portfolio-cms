// About Images API - Update and Delete
// PUT: Update about image (alt text, order)
// DELETE: Delete about image

import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1-client';

interface AboutImage {
  id: string;
  url: string;
  alt: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// PUT: Update about image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { alt, order_index } = body;

    // Check if image exists
    const existingResult = await queryD1(
      'SELECT * FROM about_images WHERE id = ?',
      [id]
    );

    if (!existingResult || !existingResult.results || existingResult.results.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

    if (alt !== undefined) {
      fields.push('alt = ?');
      values.push(alt || null);
    }

    if (order_index !== undefined) {
      fields.push('order_index = ?');
      values.push(order_index);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE about_images SET ${fields.join(', ')} WHERE id = ?`;
    await queryD1(sql, values);

    // Fetch updated image
    const result = await queryD1(
      'SELECT * FROM about_images WHERE id = ?',
      [id]
    );

    if (result && result.results && result.results.length > 0) {
      const row = result.results[0];
      const image: AboutImage = {
        id: row.id,
        url: row.url,
        alt: row.alt,
        order_index: row.order_index,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      return NextResponse.json({ image });
    }

    throw new Error('Failed to retrieve updated image');
  } catch (error) {
    console.error('Error updating about image:', error);
    return NextResponse.json(
      { error: 'Failed to update about image' },
      { status: 500 }
    );
  }
}

// DELETE: Delete about image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if image exists
    const existingResult = await queryD1(
      'SELECT * FROM about_images WHERE id = ?',
      [id]
    );

    if (!existingResult || !existingResult.results || existingResult.results.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete the image
    await queryD1('DELETE FROM about_images WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting about image:', error);
    return NextResponse.json(
      { error: 'Failed to delete about image' },
      { status: 500 }
    );
  }
}
