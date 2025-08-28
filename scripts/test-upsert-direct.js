#!/usr/bin/env node

/**
 * Test Upsert Direct
 * Test the upsert functions directly to see if they work
 */

require('dotenv').config({ path: '.env.local' });

async function testUpsertDirect() {
  console.log('🔧 Testing upsert functions directly...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  try {
    // Test 1: Search for existing contact
    console.log('\n1️⃣ Testing contact search...');
    
    const searchData = {
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: 'upsert.test@example.com'
        }]
      }],
      properties: ['firstname', 'lastname', 'email', 'wsa_role'],
      limit: 1
    };
    
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData)
    });
    
    console.log('Search response status:', searchResponse.status);
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      console.log('Search found:', searchResult.total, 'contacts');
      
      if (searchResult.total > 0) {
        const existingContact = searchResult.results[0];
        console.log('Existing contact:', existingContact.id, existingContact.properties.email);
        
        // Test 2: Update existing contact
        console.log('\n2️⃣ Testing contact update...');
        
        const updateData = {
          properties: {
            firstname: 'Updated',
            lastname: 'Upsert',
            wsa_role: 'Nominator',
            source: 'WSA26',
            source_detail: 'WSS26',
            wsa_year: 2026
          }
        };
        
        const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          console.log('✅ Contact updated successfully');
        } else {
          const updateError = await updateResponse.text();
          console.log('❌ Contact update failed:', updateError);
        }
        
      } else {
        // Test 3: Create new contact
        console.log('\n3️⃣ Testing contact creation...');
        
        const createData = {
          properties: {
            email: 'upsert.test@example.com',
            firstname: 'Upsert',
            lastname: 'Test',
            wsa_role: 'Nominator',
            source: 'WSA26',
            source_detail: 'WSS26',
            wsa_year: 2026
          }
        };
        
        const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createData)
        });
        
        if (createResponse.ok) {
          const result = await createResponse.json();
          console.log('✅ Contact created successfully, ID:', result.id);
        } else {
          const createError = await createResponse.text();
          console.log('❌ Contact creation failed:', createError);
        }
      }
      
    } else {
      const searchError = await searchResponse.text();
      console.log('❌ Contact search failed:', searchError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpsertDirect();