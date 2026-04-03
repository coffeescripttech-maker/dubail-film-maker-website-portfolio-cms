import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2-storage';
import { queryD1 } from '@/lib/d1-client';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const videoBlob = formData.get('video') as Blob;
    
    if (!videoBlob) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await videoBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to R2
    const result = await uploadFile(
      buffer,
      `thumbnail-clip-${id}-${Date.now()}.mp4`,
      {
        folder: 'projects/thumbnail-clips',
        contentType: 'video/mp4',
        metadata: {
          projectId: id,
          type: 'thumbnail-clip'
        }
      }
    );

    // Update database
    console.log('💾 ========== DATABASE UPDATE ==========');
    console.log('💾 Project ID:', id);
    console.log('💾 Thumbnail URL:', result.publicUrl);
    
    const updateResult = await queryD1(
      'UPDATE projects SET video_thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [result.publicUrl, id]
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
      
      if (project.video_thumbnail_url === result.publicUrl) {
        console.log('✅✅✅ DATABASE UPDATE CONFIRMED! ✅✅✅');
      } else {
        console.error('❌ DATABASE UPDATE FAILED - URL mismatch!');
        console.error('   Expected:', result.publicUrl);
        console.error('   Got:', project.video_thumbnail_url);
      }
    } else {
      console.error('❌ Project not found in database!');
    }
    console.log('💾 ========================================');

    return NextResponse.json({
      success: true,
      url: result.publicUrl,
      message: 'Thumbnail clip uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading thumbnail clip:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload thumbnail clip',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
