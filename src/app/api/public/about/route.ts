// Public About API
// GET: Fetch about content and images for portfolio website
// No authentication required

import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1-client';

// CORS headers for public API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Fetch about content
    const aboutResult = await queryD1(
      'SELECT * FROM about_content WHERE id = 1'
    );

    // Fetch about images
    const imagesResult = await queryD1(
      'SELECT id, url, alt, order_index FROM about_images ORDER BY order_index ASC, created_at ASC'
    );

    const aboutContent = aboutResult?.results?.[0] || {};
    const images = imagesResult?.results || [];

    // Helper function to convert newlines to <br /> tags for HTML rendering
    const convertNewlinesToBr = (text: string) => {
      if (!text) return '';
      // Replace \n with <br /> for proper HTML rendering
      return text.replace(/\n/g, '<br />');
    };

    // Format response to match existing about.json structure
    const response = {
      page: {
        title: 'About',
        description: 'Award-winning filmmaker and international film production house based in Dubai.',
        founder: {
          name: aboutContent.founder_name || 'Ahmed Al Mutawa',
          title: aboutContent.founder_title || 'FILM DIRECTOR / EXECUTIVE PRODUCER',
          bio: convertNewlinesToBr(aboutContent.founder_bio || '')
        },
        content: {
          main_text: convertNewlinesToBr(aboutContent.company_description || ''),
          video_button: {
            text: aboutContent.video_button_text || 'view DubaiFilmMaker reel 2025',
            video_url: aboutContent.video_url || ''
          }
        },
        images: images.map((img: any) => ({
          url: img.url,
          alt: img.alt || ''
        }))
      }
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching public about data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about data' },
      { status: 500, headers: corsHeaders }
    );
  }
}
