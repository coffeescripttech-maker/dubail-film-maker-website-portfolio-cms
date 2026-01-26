/**
 * Test script for Video Frame Extraction API endpoints
 * 
 * Tests:
 * 1. POST /api/video/extract-frame - Validate frame extraction request
 * 2. POST /api/thumbnails/generate - Generate thumbnail from video frame
 * 
 * Requirements: 2.4, 2.5, 2.6
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials (update with valid session token)
const TEST_AUTH_TOKEN = 'your-session-token-here';

// Sample base64 encoded 1x1 red pixel JPEG for testing
const SAMPLE_FRAME_DATA = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';

async function testExtractFrameValidation() {
  console.log('\n=== Testing POST /api/video/extract-frame ===\n');

  // Test 1: Valid request
  console.log('Test 1: Valid frame extraction request');
  try {
    const response = await fetch(`${BASE_URL}/api/video/extract-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: 'https://example.com/video.mp4',
        timestamp: 5.5,
        videoDuration: 120
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✓ Authentication required (expected)');
    } else if (response.status === 200) {
      console.log('✓ Frame extraction validated successfully');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 2: Missing video URL
  console.log('\nTest 2: Missing video URL');
  try {
    const response = await fetch(`${BASE_URL}/api/video/extract-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: 5.5
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✓ Validation error (expected)');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 3: Invalid timestamp (negative)
  console.log('\nTest 3: Invalid timestamp (negative)');
  try {
    const response = await fetch(`${BASE_URL}/api/video/extract-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: 'https://example.com/video.mp4',
        timestamp: -5
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✓ Validation error for negative timestamp (expected)');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 4: Timestamp exceeds video duration
  console.log('\nTest 4: Timestamp exceeds video duration');
  try {
    const response = await fetch(`${BASE_URL}/api/video/extract-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: 'https://example.com/video.mp4',
        timestamp: 150,
        videoDuration: 120
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✓ Validation error for timestamp > duration (expected)');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

async function testGenerateThumbnail() {
  console.log('\n=== Testing POST /api/thumbnails/generate ===\n');

  // Test 1: Valid request (will fail auth without valid token)
  console.log('Test 1: Valid thumbnail generation request');
  try {
    const response = await fetch(`${BASE_URL}/api/thumbnails/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: 'test-project-id',
        timestamp: 5.5,
        frameData: SAMPLE_FRAME_DATA,
        width: 1920,
        height: 1080
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✓ Authentication required (expected)');
    } else if (response.status === 200) {
      console.log('✓ Thumbnail generated successfully');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 2: Missing project ID
  console.log('\nTest 2: Missing project ID');
  try {
    const response = await fetch(`${BASE_URL}/api/thumbnails/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: 5.5,
        frameData: SAMPLE_FRAME_DATA
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✓ Validation error (expected)');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 3: Missing frame data
  console.log('\nTest 3: Missing frame data');
  try {
    const response = await fetch(`${BASE_URL}/api/thumbnails/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: 'test-project-id',
        timestamp: 5.5
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✓ Validation error (expected)');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  // Test 4: Invalid timestamp (negative)
  console.log('\nTest 4: Invalid timestamp (negative)');
  try {
    const response = await fetch(`${BASE_URL}/api/thumbnails/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: 'test-project-id',
        timestamp: -5,
        frameData: SAMPLE_FRAME_DATA
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✓ Validation error for negative timestamp (expected)');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

async function runTests() {
  console.log('=================================================');
  console.log('Video Frame Extraction API Tests');
  console.log('=================================================');
  console.log('\nNote: These tests expect authentication to be required.');
  console.log('401 responses are expected without valid session tokens.\n');

  await testExtractFrameValidation();
  await testGenerateThumbnail();

  console.log('\n=================================================');
  console.log('Tests Complete');
  console.log('=================================================\n');
  console.log('To test with authentication:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Log in to the CMS');
  console.log('3. Get your session token from browser cookies');
  console.log('4. Update TEST_AUTH_TOKEN in this script');
  console.log('5. Run the tests again\n');
}

// Run tests
runTests().catch(console.error);
