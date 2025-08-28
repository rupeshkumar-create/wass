#!/usr/bin/env node

/**
 * Debug Vote Sync Test
 * Tests the complete vote sync flow with detailed logging
 */

require('dotenv').config({ path: '.env.local' });

async function testVoteSyncDebug() {
  console.log('🔧 Testing Vote Sync with Debug Info...');
  
  const testEmail = 'wopare9629@ahanim.com';
  
  try {
    console.log('\n1️⃣ Testing vote sync API endpoint...');
    
    const voteData = {
      voter: {
        email: testEmail,
        firstName: 'Test',
        lastName: 'Voter',
        company: 'Test Company Ltd',
        linkedin: 'https://linkedin.com/in/testvoter'
      },
      nominee: {
        id: 'test-nominee-123',
        name: 'Jane Smith',
        type: 'person',
        linkedin: 'https://linkedin.com/in/janesmith',
        email: 'jane.smith@example.com'
      },
      category: 'top-recruiter',
      subcategoryId: 'top-recruiter'
    };
    
    console.log('Sending vote data:', JSON.stringify(voteData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/sync/hubspot/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Vote sync API response:', result);
      
      if (result.voterContactId) {
        console.log('✅ Voter contact created with ID:', result.voterContactId);
        
        // Now search for the contact in HubSpot
        console.log('\n2️⃣ Searching for the contact in HubSpot...');
        await searchContactInHubSpot(testEmail);
      }
    } else {
      const error = await response.text();
      console.error('❌ Vote sync API failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function searchContactInHubSpot(email) {
  const token = process.env.HUBSPOT_TOKEN;
  
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
          'hs_lead_source',
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
        console.log('✅ Contact found in HubSpot:');
        console.log('   ID:', contact.id);
        console.log('   Name:', contact.properties.firstname, contact.properties.lastname);
        console.log('   Email:', contact.properties.email);
        console.log('   Company:', contact.properties.company);
        console.log('   LinkedIn:', contact.properties.linkedin);
        console.log('   Lead Source:', contact.properties.hs_lead_source);
        console.log('   WSA Year:', contact.properties.wsa_year);
        console.log('   WSA Role:', contact.properties.wsa_role);
        console.log('   Voted For:', contact.properties.wsa_voted_for_display_name);
        console.log('   Vote Category:', contact.properties.wsa_voted_subcategory_id);
        console.log('   Vote Timestamp:', contact.properties.wsa_vote_timestamp);
      } else {
        console.log('❌ Contact not found in HubSpot search');
      }
    } else {
      const error = await searchResponse.text();
      console.error('❌ HubSpot search failed:', error);
    }
  } catch (error) {
    console.error('❌ Search error:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/test');
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testVoteSyncDebug();
  }
}

main();