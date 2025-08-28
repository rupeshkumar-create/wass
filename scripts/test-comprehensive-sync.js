#!/usr/bin/env node

/**
 * Comprehensive Sync Test
 * Tests syncing of nominators, nominees, and voters with all details
 */

require('dotenv').config({ path: '.env.local' });

async function testComprehensiveSync() {
  console.log('🔧 Testing Comprehensive HubSpot Sync...');
  
  try {
    // Test 1: Nomination Submit Sync
    console.log('\n1️⃣ Testing Nomination Submit Sync...');
    await testNominationSubmitSync();
    
    // Test 2: Vote Sync
    console.log('\n2️⃣ Testing Vote Sync...');
    await testVoteSync();
    
    // Test 3: Verify all contacts in HubSpot
    console.log('\n3️⃣ Verifying all contacts in HubSpot...');
    await verifyContactsInHubSpot();
    
    console.log('\n🎉 Comprehensive sync test completed!');
    
  } catch (error) {
    console.error('❌ Comprehensive sync test failed:', error.message);
  }
}

async function testNominationSubmitSync() {
  const nominationData = {
    nominator: {
      email: 'john.nominator@example.com',
      name: 'John Nominator',
      company: 'Nominator Corp',
      linkedin: 'https://linkedin.com/in/john-nominator'
    },
    nominee: {
      name: 'Jane Excellent',
      type: 'person',
      linkedin: 'https://linkedin.com/in/jane-excellent',
      email: 'jane.excellent@example.com',
      firstName: 'Jane',
      lastName: 'Excellent',
      title: 'Senior Recruiter',
      whyVoteForMe: 'I have 10 years of experience and placed 500+ candidates with 95% retention rate.'
    },
    category: 'top-recruiter',
    categoryGroupId: 'top',
    subcategoryId: 'top-recruiter',
    whyNominated: 'Jane consistently exceeds targets and builds lasting relationships with clients and candidates.',
    imageUrl: 'https://example.com/jane-photo.jpg'
  };
  
  console.log('Sending nomination data...');
  
  const response = await fetch('http://localhost:3000/api/sync/hubspot/nomination-submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nominationData)
  });
  
  console.log('Response status:', response.status);
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Nomination sync result:', JSON.stringify(result, null, 2));
  } else {
    const error = await response.text();
    console.error('❌ Nomination sync failed:', error);
  }
}

async function testVoteSync() {
  const voteData = {
    voter: {
      email: 'mary.voter@example.com',
      firstName: 'Mary',
      lastName: 'Voter',
      company: 'Voter Industries',
      linkedin: 'https://linkedin.com/in/mary-voter'
    },
    nominee: {
      id: 'nominee-123',
      name: 'Jane Excellent',
      type: 'person',
      linkedin: 'https://linkedin.com/in/jane-excellent',
      email: 'jane.excellent@example.com'
    },
    category: 'top-recruiter',
    subcategoryId: 'top-recruiter'
  };
  
  console.log('Sending vote data...');
  
  const response = await fetch('http://localhost:3000/api/sync/hubspot/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(voteData)
  });
  
  console.log('Response status:', response.status);
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Vote sync result:', JSON.stringify(result, null, 2));
  } else {
    const error = await response.text();
    console.error('❌ Vote sync failed:', error);
  }
}

async function verifyContactsInHubSpot() {
  const token = process.env.HUBSPOT_TOKEN;
  
  const testEmails = [
    'john.nominator@example.com',
    'jane.excellent@example.com', 
    'mary.voter@example.com'
  ];
  
  for (const email of testEmails) {
    console.log(`\n🔍 Checking contact: ${email}`);
    
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
            'wsa_nomination_category',
            'wsa_voted_for_display_name',
            'wsa_why_vote_for_me',
            'wsa_why_nominated',
            'wsa_nominator_name',
            'wsa_nominator_email'
          ]
        })
      });
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        
        if (searchResult.total > 0) {
          const contact = searchResult.results[0];
          console.log('✅ Contact found:');
          console.log('   ID:', contact.id);
          console.log('   Name:', contact.properties.firstname, contact.properties.lastname);
          console.log('   Email:', contact.properties.email);
          console.log('   Company:', contact.properties.company);
          console.log('   LinkedIn:', contact.properties.linkedin || '❌ EMPTY');
          console.log('   Source:', contact.properties.source || '❌ EMPTY');
          console.log('   WSA Role:', contact.properties.wsa_role);
          console.log('   WSA Year:', contact.properties.wsa_year);
          console.log('   Category:', contact.properties.wsa_nomination_category);
          console.log('   Voted For:', contact.properties.wsa_voted_for_display_name);
          console.log('   Why Vote:', contact.properties.wsa_why_vote_for_me ? 'Present' : 'Empty');
          console.log('   Why Nominated:', contact.properties.wsa_why_nominated ? 'Present' : 'Empty');
          console.log('   Nominator:', contact.properties.wsa_nominator_name);
          
          // Check for completeness
          const missingFields = [];
          if (!contact.properties.linkedin) missingFields.push('LinkedIn');
          if (!contact.properties.source) missingFields.push('Source');
          if (!contact.properties.wsa_role) missingFields.push('WSA Role');
          
          if (missingFields.length > 0) {
            console.log('   ⚠️  Missing:', missingFields.join(', '));
          } else {
            console.log('   ✅ All key fields present!');
          }
        } else {
          console.log('❌ Contact not found');
        }
      } else {
        console.log('❌ Search failed');
      }
    } catch (error) {
      console.error('❌ Error checking contact:', error.message);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/test');
    if (response.ok || response.status === 404) {
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
    await testComprehensiveSync();
  }
}

main();