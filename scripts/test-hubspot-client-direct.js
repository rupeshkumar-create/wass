#!/usr/bin/env node

/**
 * Test HubSpot Client Direct
 * Test basic HubSpot API calls to isolate the issue
 */

require('dotenv').config({ path: '.env.local' });

async function testHubSpotClient() {
  console.log('🔧 Testing HubSpot Client Direct...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment');
    return;
  }
  
  console.log('✅ Token found, length:', token.length);
  
  try {
    // Test 1: Simple contact search
    console.log('\n1️⃣ Testing contact search...');
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: 'test@example.com'
          }]
        }],
        properties: ['firstname', 'lastname', 'email'],
        limit: 1
      })
    });
    
    console.log('Search response status:', searchResponse.status);
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      console.log('✅ Search successful, found:', searchResult.total, 'contacts');
    } else {
      const errorText = await searchResponse.text();
      console.log('❌ Search failed:', errorText);
    }
    
    // Test 2: Simple contact create
    console.log('\n2️⃣ Testing contact create...');
    const createData = {
      properties: {
        email: 'hubspot.test2@example.com',
        firstname: 'HubSpot',
        lastname: 'Test',
        wsa_year: 2026,
        wsa_role: 'Nominator',
        source_detail: 'WSS26'
      }
    };
    
    console.log('Creating contact with data:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createData)
    });
    
    console.log('Create response status:', createResponse.status);
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Create successful, contact ID:', createResult.id);
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Create failed:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Could not parse error as JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHubSpotClient();