#!/usr/bin/env node

/**
 * Direct HubSpot Test with New Token
 */

const fetch = globalThis.fetch;

console.log('🧪 Direct HubSpot Test with New Token');
console.log('=====================================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function testHubSpotDirect() {
  console.log('🔗 Testing HubSpot API with new token...');
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ HubSpot API connection successful');
      console.log(`   Found ${data.results?.length || 0} contacts`);
      
      // Test creating a contact
      console.log('\n📤 Testing contact creation...');
      const testContact = {
        properties: {
          firstname: 'Test',
          lastname: 'HubSpot Direct',
          email: `test.hubspot.direct.${Date.now()}@example.com`,
          wsa_year: '2026',
          wsa_segments: 'nominators_2026',
          wsa_linkedin_url: 'https://www.linkedin.com/in/test-hubspot-direct'
        }
      };

      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testContact)
      });

      if (createResponse.ok) {
        const contactData = await createResponse.json();
        console.log('✅ Contact creation successful');
        console.log(`   Contact ID: ${contactData.id}`);
        console.log(`   Email: ${contactData.properties.email}`);
        console.log(`   WSA Year: ${contactData.properties.wsa_year}`);
        console.log(`   WSA Segments: ${contactData.properties.wsa_segments}`);
        
        return true;
      } else {
        const error = await createResponse.text();
        console.log('❌ Contact creation failed');
        console.log(`   Status: ${createResponse.status}`);
        console.log(`   Error: ${error}`);
        return false;
      }
      
    } else {
      const error = await response.text();
      console.log('❌ HubSpot API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ HubSpot API error:', error.message);
    return false;
  }
}

async function testNominationFlow() {
  console.log('\n🎯 Testing Nomination Flow...');
  
  const timestamp = Date.now();
  const nominationData = {
    category: 'Top Recruiter',
    nominator: {
      name: 'Direct Test Nominator',
      email: `direct.test.nominator.${timestamp}@example.com`,
      linkedin: `https://www.linkedin.com/in/direct-test-nominator-${timestamp}`
    },
    nominee: {
      name: 'Direct Test Nominee',
      email: `direct.test.nominee.${timestamp}@example.com`,
      title: 'Senior Recruiter',
      country: 'United States',
      linkedin: `https://www.linkedin.com/in/direct-test-nominee-${timestamp}`,
      whyVoteForMe: 'Direct test nomination',
      imageUrl: 'https://example.com/test.jpg'
    }
  };

  try {
    // Submit nomination
    console.log('📤 Submitting nomination...');
    const response = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nominationData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nomination submitted successfully');
      console.log(`   ID: ${result.id}`);
      
      // Wait for sync
      console.log('⏳ Waiting for sync...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check HubSpot
      await checkHubSpotContact(nominationData.nominator.email, 'Nominator');
      
      // Approve nomination
      console.log('📤 Approving nomination...');
      const approveResponse = await fetch('http://localhost:3000/api/nominations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: result.id,
          status: 'approved'
        })
      });

      if (approveResponse.ok) {
        console.log('✅ Nomination approved');
        
        // Wait for nominee sync
        console.log('⏳ Waiting for nominee sync...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check nominee in HubSpot
        await checkHubSpotContact(nominationData.nominee.email, 'Nominee');
        
        return true;
      } else {
        const error = await approveResponse.text();
        console.log('❌ Approval failed:', error);
        return false;
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Nomination failed:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Nomination flow error:', error.message);
    return false;
  }
}

async function checkHubSpotContact(email, type) {
  console.log(`🔍 Checking ${type} in HubSpot: ${email}`);
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
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
        properties: ['firstname', 'lastname', 'email', 'wsa_year', 'wsa_segments', 'wsa_linkedin_url'],
        limit: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const contact = data.results[0];
        console.log(`   ✅ ${type} found in HubSpot`);
        console.log(`      Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
        console.log(`      WSA Year: ${contact.properties.wsa_year}`);
        console.log(`      WSA Segments: ${contact.properties.wsa_segments}`);
        console.log(`      LinkedIn: ${contact.properties.wsa_linkedin_url}`);
        return true;
      } else {
        console.log(`   ❌ ${type} not found in HubSpot`);
        return false;
      }
    } else {
      const error = await response.text();
      console.log(`   ❌ Error checking ${type}: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking ${type}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Direct HubSpot Test');
  console.log('===============================');
  
  const directTest = await testHubSpotDirect();
  if (!directTest) {
    console.log('\n❌ Direct HubSpot test failed');
    process.exit(1);
  }
  
  const nominationTest = await testNominationFlow();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Direct HubSpot API: PASS`);
  console.log(`${nominationTest ? '✅' : '❌'} Nomination Flow: ${nominationTest ? 'PASS' : 'FAIL'}`);
  
  if (nominationTest) {
    console.log('\n🎉 HubSpot sync is working!');
  } else {
    console.log('\n⚠️  Check server logs for sync issues');
  }
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});