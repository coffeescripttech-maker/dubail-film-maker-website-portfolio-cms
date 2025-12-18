import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryD1 } from '@/lib/d1-client';

export async function GET(request: NextRequest) {
  try {
    // Logo settings are public - no authentication required
    // This allows logos to be displayed on signin page and other public pages
    
    const result = await queryD1('SELECT * FROM logo_settings WHERE id = 1');
    
    if (!result || !result.results || result.results.length === 0) {
      // Return default values if not found
      return NextResponse.json({
        id: 1,
        logo_light: '/images/logo/logo.svg',
        logo_dark: '/images/logo/logo-dark.svg',
        logo_icon: '/images/logo/logo-icon.svg',
      });
    }

    return NextResponse.json(result.results[0]);
  } catch (error) {
    console.error('Error fetching logo settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo settings' },
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
    const { logo_light, logo_dark, logo_icon } = body;

    console.log('Updating logo settings:', { logo_light, logo_dark, logo_icon });

    // Update logo settings
    await queryD1(
      `UPDATE logo_settings SET 
        logo_light = ?,
        logo_dark = ?,
        logo_icon = ?
      WHERE id = 1`,
      [logo_light, logo_dark, logo_icon]
    );

    // Fetch updated data
    const result = await queryD1('SELECT * FROM logo_settings WHERE id = 1');
    
    console.log('Logo settings updated successfully:', result.results[0]);
    
    return NextResponse.json(result.results[0]);
  } catch (error) {
    console.error('Error updating logo settings:', error);
    return NextResponse.json(
      { error: 'Failed to update logo settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
