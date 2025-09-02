#!/usr/bin/env node

/**
 * Direct HubSpot Contact Creation Test
 * Bypasses the API and tests HubSpot directly with the new properties
 */

require('dotenv').config({ path: '.env.local' });

async function testDirectHubSpotContact() {
  console.log('🔧 Testing Direct HubSpot Contact Creation...');
  
  const token = process.env.HUBSPOT_TOKEN;
  const testEmail = 'wopare9629@ahanim.com';
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    console.log('\n1️⃣ Creating contact with WSA properties and source...');
    
    const contactData = {
      properties: {
        firstname: 'Test',
        lastname: 'Voter',
        email: testEmail,
        company: 'Test Company Ltd',
        linkedin: 'https://linkedin.com/in/testvoter',
        source: 'WSA26',
        wsa_year: 2026,
        wsa_role: 'Voter',
        wsa_voted_for_display_name: 'Jane Smith',
        wsa_voted_subcategory_id: 'top-recruiter',
        wsa_vote_timestamp: new Date().toISOString()
      }
    };
    
    console.log('Contact data:', JSON.stringify(contactData, null, 2));
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Contact created successfully!');
      console.log('   ID:', result.id);
      console.log('   Email:', result.properties.email);
      console.log('   LinkedIn:', result.properties.linkedin);
      console.log('   Lead Source:', result.properties.hs_lead_source);
      console.log('   WSA Role:', result.properties.wsa_role);
      console.log('   WSA Year:', result.properties.wsa_year);
      console.log('   Voted For:', result.properties.wsa_voted_for_display_name);
      console.log('   Vote Category:', result.properties.wsa_voted_subcategory_id);
      console.log('   Vote Timestamp:', result.properties.wsa_vote_timestamp);
      
      // Now search for the contact to verify it exists
      console.log('\n2️⃣ Searching for the contact...');
      await searchForContact(testEmail, token);
      
    } else {
      const error = await response.text();
      console.error('❌ Failed to create contact:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function searchForContact(email, token) {
  try {
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
            value: email
          }]
        }],
        properties: [
          'firstname', 
          'lastname', 
          'email', 
          'company',
          'linkedin',
          'source',
          'wsa_year',
          'wsa_role',
          'wsa_voted_for_display_name',
          'wsa_voted_subcategory_id',
          'wsa_vote_timestamp'
        ]
      })
    });
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      
      if (searchResult.total > 0) {
        const contact = searchResult.results[0];
        console.log('✅ Contact found in search:');
        console.log('   ID:', contact.id);
        console.log('   Name:', contact.properties.firstname, contact.properties.lastname);
        console.log('   Email:', contact.properties.email);
        console.log('   Company:', contact.properties.company);
        console.log('   LinkedIn:', contact.properties.linkedin || '❌ EMPTY');
        console.log('   Source:', contact.properties.source || '❌ EMPTY');
        console.log('   WSA Year:', contact.properties.wsa_year);
        console.log('   WSA Role:', contact.properties.wsa_role);
        console.log('   Voted For:', contact.properties.wsa_voted_for_display_name);
        console.log('   Vote Category:', contact.properties.wsa_voted_subcategory_id);
        console.log('   Vote Timestamp:', contact.properties.wsa_vote_timestamp);
        
        if (!contact.properties.linkedin) {
          console.log('\n⚠️  LinkedIn URL is empty - this confirms the issue you reported!');
        }
        
        if (!contact.properties.source) {
          console.log('\n⚠️  Source is empty - this confirms the source issue!');
        }
        
      } else {
        console.log('❌ Contact not found in search');
      }
    } else {
      const error = await searchResponse.text();
      console.error('❌ Search failed:', error);
    }
  } catch (error) {
    console.error('❌ Search error:', error.message);
  }
}

testDirectHubSpotContact();