#!/usr/bin/env node

/**
 * Direct HubSpot Sync Test
 * Tests HubSpot sync by calling the API directly
 */

async function testHubSpotSyncDirect() {
  console.log('🔧 Testing HubSpot Sync Direct API Call...');
  
  try {
    // Test creating a contact directly via HubSpot API
    console.log('\n1️⃣ Testing direct HubSpot contact creation...');
    
    const contactData = {
      properties: {
        firstname: 'Direct',
        lastname: 'API Test',
        email: 'direct.api.test@example.com',
        phone: '+1-555-123-4567',
        wsa_segments: 'Voter 2026', // Use the correct value from HubSpot
        lifecyclestage: 'subscriber'
      }
    };
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Direct HubSpot API call failed:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Contact created successfully:', result.id);
    console.log('   Email:', result.properties.email);
    console.log('   WSA Segments:', result.properties.wsa_segments);
    
    // Test 2: Search for the contact we just created
    console.log('\n2️⃣ Searching for the created contact...');
    
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: 'direct.api.test@example.com'
          }]
        }],
        properties: ['firstname', 'lastname', 'email', 'phone', 'wsa_segments', 'lifecyclestage']
      })
    });
    
    const searchResult = await searchResponse.json();
    
    if (searchResult.total > 0) {
      const contact = searchResult.results[0];
      console.log('✅ Contact found in search:');
      console.log('   Name:', contact.properties.firstname, contact.properties.lastname);
      console.log('   Email:', contact.properties.email);
      console.log('   Phone:', contact.properties.phone);
      console.log('   WSA Segments:', contact.properties.wsa_segments);
      console.log('   Lifecycle Stage:', contact.properties.lifecyclestage);
    } else {
      console.log('❌ Contact not found in search');
    }
    
    console.log('\n🎉 Direct HubSpot sync test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHubSpotSyncDirect();