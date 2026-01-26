/**
 * Simple test for the /api/projects/reorder endpoint
 * This test creates test projects, reorders them, and verifies the result
 */

const BASE_URL = 'http://localhost:3000';

async function createTestProject(title, orderIndex) {
  const response = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      order_index: orderIndex,
      is_published: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }
  
  return await response.json();
}

async function getProjects() {
  const response = await fetch(`${BASE_URL}/api/projects`);
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }
  return await response.json();
}

async function reorderProjects(updates) {
  const response = await fetch(`${BASE_URL}/api/projects/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ updates })
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function deleteProject(id) {
  await fetch(`${BASE_URL}/api/projects/${id}`, {
    method: 'DELETE'
  });
}

async function runTest() {
  console.log('🚀 Testing Reorder Endpoint\n');
  
  let testProjectIds = [];
  
  try {
    // Step 1: Create test projects
    console.log('📝 Step 1: Creating test projects...');
    const project1 = await createTestProject('Test Film A', 10);
    const project2 = await createTestProject('Test Film B', 20);
    const project3 = await createTestProject('Test Film C', 30);
    
    testProjectIds = [project1.id, project2.id, project3.id];
    console.log(`✅ Created 3 test projects`);
    console.log(`   - ${project1.id}: ${project1.title} (order: ${project1.order_index})`);
    console.log(`   - ${project2.id}: ${project2.title} (order: ${project2.order_index})`);
    console.log(`   - ${project3.id}: ${project3.title} (order: ${project3.order_index})`);
    
    // Step 2: Test valid reorder
    console.log('\n🔄 Step 2: Testing valid reorder...');
    const reorderResult = await reorderProjects([
      { projectId: project1.id, orderIndex: 30 },
      { projectId: project2.id, orderIndex: 10 },
      { projectId: project3.id, orderIndex: 20 }
    ]);
    
    if (reorderResult.status === 200) {
      console.log('✅ Reorder successful!');
      console.log(`   Updated ${reorderResult.data.count} projects`);
      reorderResult.data.projects.forEach(p => {
        console.log(`   - ${p.id}: ${p.title} (order: ${p.order_index})`);
      });
    } else {
      console.log('❌ Reorder failed:', reorderResult.data);
    }
    
    // Step 3: Verify order in database
    console.log('\n🔍 Step 3: Verifying order in database...');
    const allProjects = await getProjects();
    const testProjects = allProjects.projects.filter(p => testProjectIds.includes(p.id));
    testProjects.sort((a, b) => a.order_index - b.order_index);
    
    console.log('Current order:');
    testProjects.forEach(p => {
      console.log(`   - ${p.title}: order_index = ${p.order_index}`);
    });
    
    // Verify the order is correct
    if (testProjects[0].id === project2.id && testProjects[0].order_index === 10 &&
        testProjects[1].id === project3.id && testProjects[1].order_index === 20 &&
        testProjects[2].id === project1.id && testProjects[2].order_index === 30) {
      console.log('✅ Order verification passed!');
    } else {
      console.log('❌ Order verification failed!');
    }
    
    // Step 4: Test error cases
    console.log('\n🧪 Step 4: Testing error cases...');
    
    // Test with non-existent project ID
    console.log('\n   Testing non-existent project ID...');
    const errorResult1 = await reorderProjects([
      { projectId: 'non-existent-id', orderIndex: 10 }
    ]);
    console.log(`   Status: ${errorResult1.status} - ${errorResult1.status === 404 ? '✅ Correct' : '❌ Wrong'}`);
    console.log(`   Message: ${errorResult1.data.error}`);
    
    // Test with duplicate project IDs
    console.log('\n   Testing duplicate project IDs...');
    const errorResult2 = await reorderProjects([
      { projectId: project1.id, orderIndex: 10 },
      { projectId: project1.id, orderIndex: 20 }
    ]);
    console.log(`   Status: ${errorResult2.status} - ${errorResult2.status === 400 ? '✅ Correct' : '❌ Wrong'}`);
    console.log(`   Message: ${errorResult2.data.error}`);
    
    // Test with empty updates
    console.log('\n   Testing empty updates array...');
    const errorResult3 = await reorderProjects([]);
    console.log(`   Status: ${errorResult3.status} - ${errorResult3.status === 400 ? '✅ Correct' : '❌ Wrong'}`);
    console.log(`   Message: ${errorResult3.data.error}`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Cleanup: Delete test projects
    console.log('\n🧹 Cleaning up test projects...');
    for (const id of testProjectIds) {
      await deleteProject(id);
    }
    console.log('✅ Cleanup complete');
  }
}

runTest().catch(console.error);
