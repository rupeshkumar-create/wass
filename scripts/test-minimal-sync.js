#!/usr/bin/env node

/**
 * Test Minimal Sync
 * Test just the basic contact creation without any complex logic
 */

require('dotenv').config({ path: '.env.local' });

async function testMinimalSync() {
  console.log('🔧 Testing minimal sync...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  try {
    // Test 1: Simple contact creation with minimal properties
    console.log('\n1️⃣ Testing minimal contact creation...');
    
    const minimalContactData = {
      properties: {
        email: 'minimal.test@example.com',
        firstname: 'Minimal',
        lastname: 'Test',
        source: 'WSA26',
        source_detail: 'WSS26',
        wsa_year: 2026,
        wsa_role: 'Nominator'
      }
    };
    
    console.log('Creating minimal contact:', JSON.stringify(minimalContactData, null, 2));
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalContactData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Minimal contact created successfully, ID:', result.id);
      
      // Test 2: Try to update the same contact (upsert behavior)
      console.log('\n2️⃣ Testing contact update...');
      
      const updateData = {
        properties: {
          company: 'Updated Company',
          linkedin: 'https://linkedin.com/in/minimal-test'
        }
      };
      
      const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${result.id}`, {
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
      const errorText = await response.text();
      console.log('❌ Minimal contact creation failed:', errorText);
      
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

testMinimalSync();