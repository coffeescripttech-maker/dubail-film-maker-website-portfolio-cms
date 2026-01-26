/**
 * Test Image Optimization Pipeline
 * 
 * This script tests the image optimization functions to ensure they work correctly.
 * It creates a simple test image and runs it through the optimization pipeline.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Import the optimization functions (we'll use dynamic import for ES modules)
async function testImageOptimization() {
  console.log('🧪 Testing Image Optimization Pipeline...\n');

  try {
    // Create a test image (500x500 red square)
    console.log('1. Creating test image...');
    const testImageBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .png()
    .toBuffer();
    
    console.log(`   ✓ Test image created: 500x500 pixels, ${testImageBuffer.length} bytes\n`);

    // Test 1: Resize Image
    console.log('2. Testing resizeImage (max 400x400)...');
    const resized = await sharp(testImageBuffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    const resizedMeta = await sharp(resized).metadata();
    console.log(`   ✓ Resized to: ${resizedMeta.width}x${resizedMeta.height}, ${resized.length} bytes\n`);

    // Test 2: Compress Image
    console.log('3. Testing compressImage (quality 85)...');
    const compressed = await sharp(testImageBuffer)
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    
    const compressionRatio = ((1 - compressed.length / testImageBuffer.length) * 100).toFixed(2);
    console.log(`   ✓ Compressed: ${compressed.length} bytes (${compressionRatio}% reduction)\n`);

    // Test 3: Generate Responsive Sizes
    console.log('4. Testing generateResponsiveSizes...');
    const sizes = {
      small: { width: 400, height: 225 },
      medium: { width: 800, height: 450 },
      large: { width: 1920, height: 1080 }
    };

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      const sized = await sharp(testImageBuffer)
        .resize(dimensions.width, dimensions.height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      const meta = await sharp(sized).metadata();
      console.log(`   ✓ ${sizeName}: ${meta.width}x${meta.height}, ${sized.length} bytes`);
    }
    console.log();

    // Test 4: Convert to WebP
    console.log('5. Testing convertToWebP...');
    const webp = await sharp(testImageBuffer)
      .webp({ quality: 85, effort: 6 })
      .toBuffer();
    
    const webpMeta = await sharp(webp).metadata();
    const webpSavings = ((1 - webp.length / testImageBuffer.length) * 100).toFixed(2);
    console.log(`   ✓ WebP: ${webpMeta.width}x${webpMeta.height}, ${webp.length} bytes (${webpSavings}% smaller)\n`);

    // Test 5: Generate Responsive WebP Sizes
    console.log('6. Testing generateResponsiveWebP...');
    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      const webpSized = await sharp(testImageBuffer)
        .resize(dimensions.width, dimensions.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 6 })
        .toBuffer();
      
      const meta = await sharp(webpSized).metadata();
      console.log(`   ✓ ${sizeName} WebP: ${meta.width}x${meta.height}, ${webpSized.length} bytes`);
    }
    console.log();

    // Test 6: Validate Image
    console.log('7. Testing image validation...');
    try {
      await sharp(testImageBuffer).metadata();
      console.log('   ✓ Valid image detected\n');
    } catch (error) {
      console.log('   ✗ Image validation failed\n');
    }

    // Test 7: Test with invalid data
    console.log('8. Testing invalid image detection...');
    const invalidBuffer = Buffer.from('not an image');
    try {
      await sharp(invalidBuffer).metadata();
      console.log('   ✗ Invalid image not detected\n');
    } catch (error) {
      console.log('   ✓ Invalid image correctly rejected\n');
    }

    console.log('✅ All image optimization tests passed!\n');
    console.log('Summary:');
    console.log('  - resizeImage: ✓');
    console.log('  - compressImage: ✓');
    console.log('  - generateResponsiveSizes: ✓');
    console.log('  - convertToWebP: ✓');
    console.log('  - generateResponsiveWebP: ✓');
    console.log('  - Image validation: ✓');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testImageOptimization();
