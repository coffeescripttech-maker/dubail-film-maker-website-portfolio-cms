// About Images API - List and Create
// GET: Fetch all about images (admin)
// POST: Upload new about image

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

// GET: Fetch all about images
export async function GET() {
  try {
    const result = await queryD1(
      'SELECT * FROM about_images ORDER BY order_index ASC, created_at ASC'
    );

    if (result && result.results) {
      const images: AboutImage[] = result.results.map((row: any) => ({
        id: row.id,
        url: row.url,
        alt: row.alt,
        order_index: row.order_index,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      return NextResponse.json({ images });
    }

    return NextResponse.json({ images: [] });
  } catch (error) {
    console.error('Error fetching about images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about images' },
      { status: 500 }
    );
  }
}

// POST: Create new about image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, alt } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get the highest order_index to append new image at the end
    const maxOrderResult = await queryD1(
      'SELECT MAX(order_index) as max_order FROM about_images'
    );

    const maxOrder = maxOrderResult?.results?.[0]?.max_order || 0;
    const newOrderIndex = maxOrder + 1;

    const id = crypto.randomUUID();

    await queryD1(
      `INSERT INTO about_images (id, url, alt, order_index) 
       VALUES (?, ?, ?, ?)`,
      [id, url, alt || null, newOrderIndex]
    );

    // Fetch the created image
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

      return NextResponse.json({ image }, { status: 201 });
    }

    throw new Error('Failed to retrieve created image');
  } catch (error) {
    console.error('Error creating about image:', error);
    return NextResponse.json(
      { error: 'Failed to create about image' },
      { status: 500 }
    );
  }
}
