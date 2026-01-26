/**
 * Test script for the /api/projects/reorder endpoint
 * 
 * This script tests:
 * 1. Valid reorder request with multiple projects
 * 2. Invalid request with missing updates array
 * 3. Invalid request with empty updates array
 * 4. Invalid request with duplicate project IDs
 * 5. Invalid request with non-existent project IDs
 * 6. Invalid request with missing orderIndex
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make API requests
async function testEndpoint(description, options) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/projects/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'll need to include authentication headers
        // For now, this assumes the endpoint is accessible or you're testing locally
      },
      ...options
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Reorder Endpoint Tests');
  console.log('═'.repeat(60));

  // First, get some existing project IDs
  console.log('\n📋 Fetching existing projects...');
  const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
  const projectsData = await projectsResponse.json();
  
  if (!projectsData.projects || projectsData.projects.length < 2) {
    console.error('❌ Need at least 2 projects in the database to test reordering');
    return;
  }

  const projects = projectsData.projects.slice(0, 3); // Get first 3 projects
  console.log(`✅ Found ${projects.length} projects to test with`);
  projects.forEach(p => console.log(`   - ${p.id}: ${p.title} (order: ${p.order_index})`));

  // Test 1: Valid reorder request
  await testEndpoint('Valid reorder request', {
    body: JSON.stringify({
      updates: [
        { projectId: projects[0].id, orderIndex: 10 },
        { projectId: projects[1].id, orderIndex: 5 },
        ...(projects[2] ? [{ projectId: projects[2].id, orderIndex: 15 }] : [])
      ]
    })
  });

  // Test 2: Missing updates array
  await testEndpoint('Missing updates array', {
    body: JSON.stringify({})
  });

  // Test 3: Empty updates array
  await testEndpoint('Empty updates array', {
    body: JSON.stringify({
      updates: []
    })
  });

  // Test 4: Duplicate project IDs
  await testEndpoint('Duplicate project IDs', {
    body: JSON.stringify({
      updates: [
        { projectId: projects[0].id, orderIndex: 10 },
        { projectId: projects[0].id, orderIndex: 20 }
      ]
    })
  });

  // Test 5: Non-existent project ID
  await testEndpoint('Non-existent project ID', {
    body: JSON.stringify({
      updates: [
        { projectId: 'non-existent-id-12345', orderIndex: 10 }
      ]
    })
  });

  // Test 6: Missing orderIndex
  await testEndpoint('Missing orderIndex', {
    body: JSON.stringify({
      updates: [
        { projectId: projects[0].id }
      ]
    })
  });

  // Test 7: Invalid orderIndex type
  await testEndpoint('Invalid orderIndex type (string instead of number)', {
    body: JSON.stringify({
      updates: [
        { projectId: projects[0].id, orderIndex: "10" }
      ]
    })
  });

  console.log('\n' + '═'.repeat(60));
  console.log('✅ All tests completed!');
  console.log('\nNote: This test requires:');
  console.log('1. The development server to be running (npm run dev)');
  console.log('2. At least 2 projects in the database');
  console.log('3. Authentication to be disabled or proper auth headers included');
}

// Run tests
runTests().catch(console.error);
