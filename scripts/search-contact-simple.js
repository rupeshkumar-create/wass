#!/usr/bin/env node

/**
 * Simple Contact Search
 * Searches for the test contact in HubSpot
 */

require('dotenv').config({ path: '.env.local' });

async function searchContactSimple() {
  console.log('🔧 Searching for Contact in HubSpot...');
  
  const token = process.env.HUBSPOT_TOKEN;
  const testEmail = 'wopare9629@ahanim.com';
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    console.log(`\n🔍 Searching for: ${testEmail}`);
    
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
            value: testEmail
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
    
    console.log('Search response status:', searchResponse.status);
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      
      console.log(`Found ${searchResult.total} contact(s)`);
      
      if (searchResult.total > 0) {
        searchResult.results.forEach((contact, index) => {
          console.log(`\n📋 Contact ${index + 1}:`);
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
          
          // Check for issues
          const issues = [];
          if (!contact.properties.linkedin) issues.push('LinkedIn URL is empty');
          if (!contact.properties.source) issues.push('Source is empty');
          
          if (issues.length > 0) {
            console.log('   ⚠️  Issues:', issues.join(', '));
          } else {
            console.log('   ✅ All properties look good!');
          }
        });
      } else {
        console.log('❌ No contacts found with that email');
        
        // Try a broader search
        console.log('\n🔍 Trying broader search for recent WSA contacts...');
        await searchRecentWSAContacts(token);
      }
    } else {
      const error = await searchResponse.text();
      console.error('❌ Search failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
  }
}

async function searchRecentWSAContacts(token) {
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
            propertyName: 'wsa_year',
            operator: 'EQ',
            value: '2026'
          }]
        }],
        properties: [
          'firstname', 
          'lastname', 
          'email', 
          'source',
          'wsa_role',
          'createdate'
        ],
        sorts: [{
          propertyName: 'createdate',
          direction: 'DESCENDING'
        }],
        limit: 10
      })
    });
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      
      console.log(`Found ${searchResult.total} WSA 2026 contacts (showing last 10):`);
      
      searchResult.results.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.properties.firstname} ${contact.properties.lastname} (${contact.properties.email}) - Source: ${contact.properties.source || 'None'} - Role: ${contact.properties.wsa_role}`);
      });
    } else {
      console.log('❌ Broader search also failed');
    }
  } catch (error) {
    console.error('❌ Broader search error:', error.message);
  }
}

searchContactSimple();