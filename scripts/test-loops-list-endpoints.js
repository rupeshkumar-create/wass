#!/usr/bin/env node

/**
 * Test Loops List Endpoints
 * Find the correct way to add contacts to lists
 */

require('dotenv').config({ path: '.env.local' });

async function testLoopsListEndpoints() {
  console.log('🔍 Testing Loops List Endpoints...\n');

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.log('❌ LOOPS_API_KEY not configured');
    return;
  }

  const baseUrl = 'https://app.loops.so/api/v1';
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const testEmail = `test-loops-list-${Date.now()}@example.com`;
  const votersListId = 'cmegxu1fc0gw70i1d7g35gqb0'; // WSA Voters 2026

  try {
    // Step 1: Create test contact
    console.log('1. Creating test contact...');
    const contactResponse = await fetch(`${baseUrl}/contacts/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: testEmail,
        firstName: 'Test',
        lastName: 'List User',
        source: 'World Staffing Awards 2026 - List Test',
      }),
    });
    
    if (!contactResponse.ok) {
      console.log(`❌ Failed to create contact: ${contactResponse.status}`);
      return;
    }
    
    const contact = await contactResponse.json();
    console.log(`   ✅ Contact created: ${contact.id}`);

    // Step 2: Test different list endpoints
    const endpointsToTest = [
      { name: 'contacts/add-to-list', method: 'POST', body: { email: testEmail, listId: votersListId } },
      { name: 'lists/add-contact', method: 'POST', body: { email: testEmail, listId: votersListId } },
      { name: 'lists/contacts', method: 'POST', body: { email: testEmail, listId: votersListId } },
      { name: `lists/${votersListId}/contacts`, method: 'POST', body: { email: testEmail } },
    ];

    for (const endpoint of endpointsToTest) {
      console.log(`\n2. Testing endpoint: ${endpoint.name}...`);
      
      try {
        const response = await fetch(`${baseUrl}/${endpoint.name}`, {
          method: endpoint.method,
          headers,
          body: JSON.stringify(endpoint.body),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ SUCCESS with ${endpoint.name}`);
          console.log(`   Response:`, result);
          break; // Found working endpoint
        } else {
          console.log(`   ❌ Failed with ${endpoint.name}: ${response.status} ${response.statusText}`);
          if (response.status !== 404) {
            const errorData = await response.text();
            console.log(`   Error details: ${errorData.substring(0, 200)}...`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error with ${endpoint.name}: ${error.message}`);
      }
    }

    // Step 3: Test getting list contacts to verify
    console.log(`\n3. Checking if contact was added to list...`);
    try {
      const listContactsResponse = await fetch(`${baseUrl}/lists/${votersListId}`, {
        method: 'GET',
        headers,
      });
      
      if (listContactsResponse.ok) {
        const listData = await listContactsResponse.json();
        console.log(`   ✅ List data retrieved`);
        console.log(`   List name: ${listData.name}`);
        console.log(`   Contact count: ${listData.contactCount || 'unknown'}`);
      } else {
        console.log(`   ❌ Failed to get list data: ${listContactsResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error getting list data: ${error.message}`);
    }

    // Step 4: Clean up
    console.log('\n4. Cleaning up test contact...');
    try {
      const deleteResponse = await fetch(`${baseUrl}/contacts/delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: testEmail,
        }),
      });
      
      if (deleteResponse.ok) {
        console.log('   ✅ Test contact deleted');
      } else {
        console.log(`   ⚠️ Failed to delete test contact: ${deleteResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Error deleting test contact: ${error.message}`);
    }

    console.log('\n✅ Loops list endpoints test completed');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testLoopsListEndpoints().catch(console.error);