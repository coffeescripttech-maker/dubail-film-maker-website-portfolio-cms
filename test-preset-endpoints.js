/**
 * Test script for Film Preset API endpoints
 * Tests: POST /api/projects/presets, GET /api/projects/presets, 
 *        PUT /api/projects/presets/:id/apply, DELETE /api/projects/presets/:id
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error('Request failed:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Film Preset API Endpoint Tests');
  console.log('='.repeat(60));

  let createdPresetId = null;

  try {
    // Test 1: Create a new preset
    console.log('\n--- Test 1: Create New Preset ---');
    const createResult = await makeRequest('/api/projects/presets', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Preset 1',
        description: 'A test preset for validation',
        orderConfig: [
          { projectId: 'project-1', orderIndex: 0 },
          { projectId: 'project-2', orderIndex: 1 },
          { projectId: 'project-3', orderIndex: 2 }
        ]
      })
    });

    if (createResult.response.status === 201) {
      console.log('✓ Preset created successfully');
      createdPresetId = createResult.data.preset?.id;
    } else {
      console.log('✗ Failed to create preset');
    }

    // Test 2: Get all presets
    console.log('\n--- Test 2: Get All Presets ---');
    const getAllResult = await makeRequest('/api/projects/presets');
    
    if (getAllResult.response.status === 200) {
      console.log(`✓ Retrieved ${getAllResult.data.count} presets`);
    } else {
      console.log('✗ Failed to get presets');
    }

    // Test 3: Create another preset
    console.log('\n--- Test 3: Create Second Preset ---');
    const createResult2 = await makeRequest('/api/projects/presets', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Preset 2',
        description: 'Another test preset',
        orderConfig: [
          { projectId: 'project-3', orderIndex: 0 },
          { projectId: 'project-1', orderIndex: 1 },
          { projectId: 'project-2', orderIndex: 2 }
        ]
      })
    });

    if (createResult2.response.status === 201) {
      console.log('✓ Second preset created successfully');
    } else {
      console.log('✗ Failed to create second preset');
    }

    // Test 4: Apply preset (if we have a valid preset ID)
    if (createdPresetId) {
      console.log('\n--- Test 4: Apply Preset ---');
      const applyResult = await makeRequest(
        `/api/projects/presets/${createdPresetId}/apply`,
        { method: 'PUT' }
      );
      
      if (applyResult.response.status === 200) {
        console.log('✓ Preset applied successfully');
      } else if (applyResult.response.status === 404) {
        console.log('⚠ Preset projects not found (expected if test projects don\'t exist)');
      } else {
        console.log('✗ Failed to apply preset');
      }
    }

    // Test 5: Delete preset (if we have a valid preset ID)
    if (createdPresetId) {
      console.log('\n--- Test 5: Delete Preset ---');
      const deleteResult = await makeRequest(
        `/api/projects/presets/${createdPresetId}`,
        { method: 'DELETE' }
      );
      
      if (deleteResult.response.status === 200) {
        console.log('✓ Preset deleted successfully');
      } else {
        console.log('✗ Failed to delete preset');
      }
    }

    // Test 6: Verify deletion
    console.log('\n--- Test 6: Verify Deletion ---');
    const verifyResult = await makeRequest('/api/projects/presets');
    
    if (verifyResult.response.status === 200) {
      console.log(`✓ Current preset count: ${verifyResult.data.count}`);
    }

    // Test 7: Test validation - empty name
    console.log('\n--- Test 7: Validation - Empty Name ---');
    const validationResult1 = await makeRequest('/api/projects/presets', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        orderConfig: [{ projectId: 'test', orderIndex: 0 }]
      })
    });
    
    if (validationResult1.response.status === 400) {
      console.log('✓ Correctly rejected empty name');
    } else {
      console.log('✗ Should have rejected empty name');
    }

    // Test 8: Test validation - missing orderConfig
    console.log('\n--- Test 8: Validation - Missing orderConfig ---');
    const validationResult2 = await makeRequest('/api/projects/presets', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Preset'
      })
    });
    
    if (validationResult2.response.status === 400) {
      console.log('✓ Correctly rejected missing orderConfig');
    } else {
      console.log('✗ Should have rejected missing orderConfig');
    }

    // Test 9: Test validation - empty orderConfig
    console.log('\n--- Test 9: Validation - Empty orderConfig ---');
    const validationResult3 = await makeRequest('/api/projects/presets', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Preset',
        orderConfig: []
      })
    });
    
    if (validationResult3.response.status === 400) {
      console.log('✓ Correctly rejected empty orderConfig');
    } else {
      console.log('✗ Should have rejected empty orderConfig');
    }

    // Test 10: Test delete non-existent preset
    console.log('\n--- Test 10: Delete Non-Existent Preset ---');
    const deleteNonExistentResult = await makeRequest(
      '/api/projects/presets/non-existent-id',
      { method: 'DELETE' }
    );
    
    if (deleteNonExistentResult.response.status === 404) {
      console.log('✓ Correctly returned 404 for non-existent preset');
    } else {
      console.log('✗ Should have returned 404');
    }

    console.log('\n' + '='.repeat(60));
    console.log('All tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
