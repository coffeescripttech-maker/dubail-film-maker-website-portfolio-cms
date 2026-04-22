import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/r2-storage';
import { queryD1 } from '@/lib/d1-client';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

// Increase max duration for large file uploads (up to 800MB)
// Vercel hobby plan limit: 300 seconds (5 minutes)
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Two modes: 
    // 1. Get presigned URL for upload
    // 2. Confirm upload and update database
    
    if (body.action === 'get-upload-url') {
      // Generate presigned URL for direct upload to R2
      const fileName = `thumbnail-clip-${id}-${Date.now()}.mp4`;
      const key = `projects/thumbnail-clips/${fileName}`;
      
      const presignedUrl = await generatePresignedUploadUrl(
        key,
        'video/mp4'
      );
      
      // Construct public URL
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      
      return NextResponse.json({
        presignedUrl,
        publicUrl,
        fileName
      });
    } else if (body.action === 'confirm-upload') {
      // Update database with the uploaded file URL
      const { publicUrl } = body;
      
      if (!publicUrl) {
        return NextResponse.json(
          { error: 'No public URL provided' },
          { status: 400 }
        );
      }
      
      console.log('💾 ========== DATABASE UPDATE ==========');
      console.log('💾 Project ID:', id);
      console.log('💾 Thumbnail URL:', publicUrl);
      
      const updateResult = await queryD1(
        'UPDATE projects SET video_thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [publicUrl, id]
      );
      
      console.log('✅ Database update result:', updateResult);
      
      // Verify the update
      console.log('🔍 Verifying database update...');
      const verifyResult = await queryD1(
        'SELECT id, title, video_thumbnail_url FROM projects WHERE id = ?',
        [id]
      );
      console.log('🔍 Verification query result:', verifyResult);
      
      if (verifyResult && verifyResult.results && verifyResult.results.length > 0) {
        const project = verifyResult.results[0];
        console.log('✅ Project found:', project.title);
        console.log('✅ video_thumbnail_url in DB:', project.video_thumbnail_url);
        
        if (project.video_thumbnail_url === publicUrl) {
          console.log('✅✅✅ DATABASE UPDATE CONFIRMED! ✅✅✅');
        } else {
          console.error('❌ DATABASE UPDATE FAILED - URL mismatch!');
          console.error('   Expected:', publicUrl);
          console.error('   Got:', project.video_thumbnail_url);
        }
      } else {
        console.error('❌ Project not found in database!');
      }
      console.log('💾 ========================================');

      return NextResponse.json({
        success: true,
        url: publicUrl,
        message: 'Thumbnail clip uploaded successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "get-upload-url" or "confirm-upload"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing thumbnail clip:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process thumbnail clip',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
