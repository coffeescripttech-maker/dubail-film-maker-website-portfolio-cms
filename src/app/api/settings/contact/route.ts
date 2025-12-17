import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryD1 } from '@/lib/d1-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await queryD1('SELECT * FROM contact_info WHERE id = 1');
    
    if (!result || !result.results || result.results.length === 0) {
      return NextResponse.json({ error: 'Contact info not found' }, { status: 404 });
    }

    return NextResponse.json(result.results[0]);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can update settings
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      phone,
      city,
      street,
      vimeo_url,
      instagram_url,
    } = body;

    await queryD1(
      `UPDATE contact_info SET 
        email = ?,
        phone = ?,
        city = ?,
        street = ?,
        vimeo_url = ?,
        instagram_url = ?
      WHERE id = 1`,
      [
        email || '',
        phone || '',
        city || '',
        street || '',
        vimeo_url || '',
        instagram_url || '',
      ]
    );

    // Fetch updated data
    const result = await queryD1('SELECT * FROM contact_info WHERE id = 1');
    
    return NextResponse.json(result.results[0]);
  } catch (error) {
    console.error('Error updating contact info:', error);
    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    );
  }
}
