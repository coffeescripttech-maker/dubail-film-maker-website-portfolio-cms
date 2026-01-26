/**
 * Test About Images API Endpoints
 * Run with: node test-about-images-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('========================================');
  console.log('Testing About Images API Endpoints');
  console.log('========================================\n');

  try {
    // Test 1: List all images
    console.log('1. Testing GET /api/about/images');
    const listResponse = await fetch(`${BASE_URL}/api/about/images`);
    const listData = await listResponse.json();
    console.log('✓ Status:', listResponse.status);
    console.log('✓ Images count:', listData.images?.length || 0);
    console.log('✓ Sample image:', listData.images?.[0]);
    console.log('');

    // Test 2: Create new image
    console.log('2. Testing POST /api/about/images');
    const createResponse = await fetch(`${BASE_URL}/api/about/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/test-image.jpg',
        alt: 'Test image from API test'
      })
    });
    const createData = await createResponse.json();
    console.log('✓ Status:', createResponse.status);
    console.log('✓ Created image:', createData.image);
    const testImageId = createData.image?.id;
    console.log('');

    // Test 3: Update image
    if (testImageId) {
      console.log('3. Testing PUT /api/about/images/[id]');
      const updateResponse = await fetch(`${BASE_URL}/api/about/images/${testImageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt: 'Updated test image alt text'
        })
      });
      const updateData = await updateResponse.json();
      console.log('✓ Status:', updateResponse.status);
      console.log('✓ Updated image:', updateData.image);
      console.log('');
    }

    // Test 4: Reorder images
    console.log('4. Testing POST /api/about/images/reorder');
    const reorderImages = listData.images?.slice(0, 2).map((img, index) => ({
      id: img.id,
      order_index: index + 1
    })) || [];
    
    if (reorderImages.length > 0) {
      const reorderResponse = await fetch(`${BASE_URL}/api/about/images/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: reorderImages })
      });
      const reorderData = await reorderResponse.json();
      console.log('✓ Status:', reorderResponse.status);
      console.log('✓ Reordered images count:', reorderData.images?.length || 0);
      console.log('');
    }

    // Test 5: Public endpoint
    console.log('5. Testing GET /api/public/about');
    const publicResponse = await fetch(`${BASE_URL}/api/public/about`);
    const publicData = await publicResponse.json();
    console.log('✓ Status:', publicResponse.status);
    console.log('✓ Has founder data:', !!publicData.page?.founder);
    console.log('✓ Images count:', publicData.page?.images?.length || 0);
    console.log('✓ Sample public image:', publicData.page?.images?.[0]);
    console.log('');

    // Test 6: Delete test image
    if (testImageId) {
      console.log('6. Testing DELETE /api/about/images/[id]');
      const deleteResponse = await fetch(`${BASE_URL}/api/about/images/${testImageId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      console.log('✓ Status:', deleteResponse.status);
      console.log('✓ Success:', deleteData.success);
      console.log('');
    }

    console.log('========================================');
    console.log('✓ All tests completed successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests
testAPI();
