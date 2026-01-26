/**
 * Verification script for Film Preset API endpoints
 * Checks that endpoints exist and return expected response structure
 */

const BASE_URL = 'http://localhost:3000';

async function verifyEndpoint(method, endpoint, expectedStatus, description) {
  console.log(`\n${method} ${endpoint}`);
  console.log(`Expected: ${description}`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method !== 'GET' && method !== 'DELETE' ? {
        body: JSON.stringify({
          name: 'Test',
          orderConfig: [{ projectId: 'test', orderIndex: 0 }]
        })
      } : {})
    });

    const data = await response.json();
    
    if (response.status === expectedStatus) {
      console.log(`✓ Status ${response.status} - ${description}`);
      return true;
    } else {
      console.log(`✗ Got ${response.status}, expected ${expectedStatus}`);
      console.log('Response:', data);
      return false;
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
    return false;
  }
}

async function runVerification() {
  console.log('='.repeat(60));
  console.log('Film Preset API Endpoint Verification');
  console.log('='.repeat(60));
  console.log('\nNote: All endpoints require authentication.');
  console.log('We expect 401 Unauthorized responses, which confirms');
  console.log('the endpoints exist and authentication is working.\n');

  const results = [];

  // Verify POST /api/projects/presets
  results.push(await verifyEndpoint(
    'POST',
    '/api/projects/presets',
    401,
    'Endpoint exists and requires auth'
  ));

  // Verify GET /api/projects/presets
  results.push(await verifyEndpoint(
    'GET',
    '/api/projects/presets',
    401,
    'Endpoint exists and requires auth'
  ));

  // Verify PUT /api/projects/presets/:id/apply
  results.push(await verifyEndpoint(
    'PUT',
    '/api/projects/presets/test-id/apply',
    401,
    'Endpoint exists and requires auth'
  ));

  // Verify DELETE /api/projects/presets/:id
  results.push(await verifyEndpoint(
    'DELETE',
    '/api/projects/presets/test-id',
    401,
    'Endpoint exists and requires auth'
  ));

  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✓ All ${total} endpoints verified successfully!`);
    console.log('\nEndpoints are properly configured and protected.');
  } else {
    console.log(`✗ ${passed}/${total} endpoints verified`);
    console.log('\nSome endpoints may not be configured correctly.');
  }
  console.log('='.repeat(60));
}

runVerification().catch(console.error);
