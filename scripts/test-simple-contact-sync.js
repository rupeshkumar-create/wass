#!/usr/bin/env node

/**
 * Simple Contact Sync Test
 * Tests creating a contact with the new WSA properties
 */

require('dotenv').config({ path: '.env.local' });

async function testSimpleContactSync() {
  console.log('🔧 Testing Simple Contact Sync...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    console.log('\n👤 Creating test contact with WSA properties...');
    
    const contactData = {
      properties: {
        firstname: 'Test',
        lastname: 'Voter',
        email: `test.voter.${Date.now()}@example.com`,
        company: 'Test Company',
        wsa_year: 2026,
        wsa_role: 'Voter',
        wsa_voted_for_display_name: 'Jane Smith',
        wsa_voted_subcategory_id: 'top-recruiter',
        wsa_vote_timestamp: new Date().toISOString()
      }
    };
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Contact created successfully!');
      console.log('   ID:', result.id);
      console.log('   Email:', result.properties.email);
      console.log('   WSA Role:', result.properties.wsa_role);
      console.log('   WSA Year:', result.properties.wsa_year);
      console.log('   Voted For:', result.properties.wsa_voted_for_display_name);
      console.log('   Vote Timestamp:', result.properties.wsa_vote_timestamp);
      
      console.log('\n🎉 Contact sync is working! The HubSpot integration should now work for votes.');
      
    } else {
      const error = await response.text();
      console.error('❌ Failed to create contact:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleContactSync();