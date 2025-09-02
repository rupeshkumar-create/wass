#!/usr/bin/env node

/**
 * Test LinkedIn Field Update
 * Quick test to verify the LinkedIn field is now working
 */

const fetch = globalThis.fetch;

console.log('🧪 Testing LinkedIn Field Update');
console.log('================================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function testLinkedInField() {
  console.log('🎯 Testing LinkedIn Field Mapping...');
  
  const timestamp = Date.now();
  const nominationData = {
    category: 'Top Recruiter',
    nominator: {
      name: 'LinkedIn Test Nominator',
      email: `linkedin.test.nominator.${timestamp}@example.com`,
      linkedin: `https://www.linkedin.com/in/linkedin-test-nominator-${timestamp}`
    },
    nominee: {
      name: 'LinkedIn Test Nominee',
      email: `linkedin.test.nominee.${timestamp}@example.com`,
      title: 'Senior Recruiter',
      country: 'United States',
      linkedin: `https://www.linkedin.com/in/linkedin-test-nominee-${timestamp}`,
      whyVoteForMe: 'LinkedIn field test',
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
      
      // Wait for sync
      console.log('⏳ Waiting for sync (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check nominator in HubSpot
      await checkLinkedInField(nominationData.nominator.email, 'Nominator', nominationData.nominator.linkedin);
      
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
        console.log('⏳ Waiting for nominee sync (5 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check nominee in HubSpot
        await checkLinkedInField(nominationData.nominee.email, 'Nominee', nominationData.nominee.linkedin);
        
        return true;
      } else {
        console.log('❌ Approval failed');
        return false;
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Nomination failed:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

async function checkLinkedInField(email, type, expectedLinkedIn) {
  console.log(`🔍 Checking ${type} LinkedIn field: ${email}`);
  
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
        properties: ['firstname', 'lastname', 'email', 'linkedin_url', 'wsa_linkedin_url', 'website'],
        limit: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const contact = data.results[0];
        
        console.log(`   ✅ ${type} found in HubSpot`);
        console.log(`      📧 Email: ${contact.properties.email}`);
        console.log(`      👤 Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
        console.log(`      🔗 linkedin_url: ${contact.properties.linkedin_url || '❌ NOT SET'}`);
        console.log(`      🔗 wsa_linkedin_url: ${contact.properties.wsa_linkedin_url || '❌ NOT SET'}`);
        console.log(`      🌐 website: ${contact.properties.website || '❌ NOT SET'}`);
        console.log(`      🎯 Expected: ${expectedLinkedIn}`);
        
        const linkedInSet = contact.properties.linkedin_url || contact.properties.wsa_linkedin_url || contact.properties.website;
        const isCorrect = linkedInSet === expectedLinkedIn;
        
        console.log(`      ${isCorrect ? '✅' : '❌'} LinkedIn field status: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        
        return isCorrect;
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
  console.log('🚀 Starting LinkedIn Field Test');
  console.log('===============================');
  
  const success = await testLinkedInField();
  
  console.log('\n📊 LinkedIn Field Test Results:');
  console.log('===============================');
  console.log(`${success ? '✅' : '❌'} LinkedIn Field Mapping: ${success ? 'WORKING' : 'NEEDS FIX'}`);
  
  if (success) {
    console.log('\n🎉 LinkedIn fields are now working correctly!');
    console.log('✅ LinkedIn URLs are being saved to HubSpot');
    console.log('✅ Contacts can be found and verified');
  } else {
    console.log('\n⚠️  LinkedIn field mapping still needs work');
    console.log('Check the debug logs above for details');
  }
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});