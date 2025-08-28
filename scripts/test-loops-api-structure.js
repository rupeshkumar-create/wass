#!/usr/bin/env node

/**
 * Test Loops API Structure
 * This script tests the actual Loops API to understand the correct endpoints
 * for managing user groups and lists
 */

require('dotenv').config({ path: '.env.local' });

async function testLoopsAPI() {
  console.log('🔍 Testing Loops API Structure...\n');

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

  try {
    // Test 1: Get all lists (user groups)
    console.log('1. Getting all lists (user groups)...');
    try {
      const listsResponse = await fetch(`${baseUrl}/lists`, {
        method: 'GET',
        headers,
      });
      
      if (listsResponse.ok) {
        const lists = await listsResponse.json();
        console.log('   ✅ Lists retrieved successfully:');
        lists.forEach(list => {
          console.log(`   - ${list.name} (ID: ${list.id})`);
        });
      } else {
        console.log(`   ❌ Failed to get lists: ${listsResponse.status} ${listsResponse.statusText}`);
        const errorData = await listsResponse.text();
        console.log(`   Error: ${errorData}`);
      }
    } catch (error) {
      console.log(`   ❌ Error getting lists: ${error.message}`);
    }

    // Test 2: Create test contact
    console.log('\n2. Creating test contact...');
    const testEmail = `test-loops-api-${Date.now()}@example.com`;
    
    try {
      const contactResponse = await fetch(`${baseUrl}/contacts/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
          source: 'World Staffing Awards 2026 - API Test',
        }),
      });
      
      if (contactResponse.ok) {
        const contact = await contactResponse.json();
        console.log(`   ✅ Contact created: ${contact.id}`);
        
        // Test 3: Try to add contact to a list
        console.log('\n3. Testing list management...');
        
        // First, let's try the documented endpoint
        try {
          const addToListResponse = await fetch(`${baseUrl}/contacts/add-to-list`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: testEmail,
              listId: 'Voters', // Try with list name first
            }),
          });
          
          if (addToListResponse.ok) {
            console.log('   ✅ Successfully added to list using name');
          } else {
            console.log(`   ❌ Failed to add to list using name: ${addToListResponse.status}`);
            const errorData = await addToListResponse.text();
            console.log(`   Error: ${errorData}`);
          }
        } catch (error) {
          console.log(`   ❌ Error adding to list: ${error.message}`);
        }

        // Test 4: Try alternative endpoints
        console.log('\n4. Testing alternative endpoints...');
        
        // Try with tags instead of lists
        try {
          const tagResponse = await fetch(`${baseUrl}/contacts/update`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              email: testEmail,
              userGroup: 'Voters', // Try as a custom property
            }),
          });
          
          if (tagResponse.ok) {
            console.log('   ✅ Successfully updated with userGroup property');
          } else {
            console.log(`   ❌ Failed to update with userGroup: ${tagResponse.status}`);
            const errorData = await tagResponse.text();
            console.log(`   Error: ${errorData}`);
          }
        } catch (error) {
          console.log(`   ❌ Error updating with userGroup: ${error.message}`);
        }

        // Test 5: Clean up - delete test contact
        console.log('\n5. Cleaning up test contact...');
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
        
      } else {
        console.log(`   ❌ Failed to create contact: ${contactResponse.status} ${contactResponse.statusText}`);
        const errorData = await contactResponse.text();
        console.log(`   Error: ${errorData}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating contact: ${error.message}`);
    }

    console.log('\n✅ Loops API structure test completed');

  } catch (error) {
    console.error('❌ Error during Loops API test:', error);
  }
}

// Run the test
testLoopsAPI().catch(console.error);