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

    const result = await queryD1('SELECT * FROM about_content WHERE id = 1');
    
    if (!result || !result.results || result.results.length === 0) {
      return NextResponse.json({ error: 'About content not found' }, { status: 404 });
    }

    return NextResponse.json(result.results[0]);
  } catch (error) {
    console.error('Error fetching about content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about content' },
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
      founder_name,
      founder_title,
      founder_bio,
      company_description,
      video_button_text,
      video_url,
    } = body;

    await queryD1(
      `UPDATE about_content SET 
        founder_name = ?,
        founder_title = ?,
        founder_bio = ?,
        company_description = ?,
        video_button_text = ?,
        video_url = ?
      WHERE id = 1`,
      [
        founder_name || '',
        founder_title || '',
        founder_bio || '',
        company_description || '',
        video_button_text || '',
        video_url || '',
      ]
    );

    // Fetch updated data
    const result = await queryD1('SELECT * FROM about_content WHERE id = 1');
    
    return NextResponse.json(result.results[0]);
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json(
      { error: 'Failed to update about content' },
      { status: 500 }
    );
  }
}
