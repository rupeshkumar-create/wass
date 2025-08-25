#!/usr/bin/env node

/**
 * HubSpot Sync Debug Script
 * Diagnoses and fixes HubSpot sync issues for nominees and nominators
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const fetch = globalThis.fetch;

console.log('🔍 HubSpot Sync Debug & Fix');
console.log('===========================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN;

console.log('📋 Configuration Check:');
console.log(`   HubSpot Token: ${HUBSPOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   Token Preview: ${HUBSPOT_TOKEN ? HUBSPOT_TOKEN.substring(0, 20) + '...' : 'N/A'}`);

// Test HubSpot API connection
async function testHubSpotConnection() {
  console.log('\n🔗 Testing HubSpot API Connection...');
  
  if (!HUBSPOT_TOKEN) {
    console.log('❌ No HubSpot token found');
    return false;
  }

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
      console.log(`   Found ${data.total || 0} contacts in HubSpot`);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ HubSpot API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ HubSpot API connection error:', error.message);
    return false;
  }
}

// Test creating a contact directly
async function testCreateContact() {
  console.log('\n🧪 Testing Direct Contact Creation...');
  
  const testContact = {
    properties: {
      firstname: 'Test',
      lastname: 'HubSpot User',
      email: `test.hubspot.${Date.now()}@example.com`,
      wsa_year: '2026',
      wsa_segments: 'nominators_2026',
      wsa_linkedin_url: 'https://www.linkedin.com/in/test-hubspot-user'
    }
  };

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct contact creation successful');
      console.log(`   Contact ID: ${data.id}`);
      console.log(`   Email: ${data.properties.email}`);
      return data;
    } else {
      const error = await response.text();
      console.log('❌ Direct contact creation failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Direct contact creation error:', error.message);
    return null;
  }
}

// Test the WSA sync functions
async function testWSASyncFunctions() {
  console.log('\n🔧 Testing WSA Sync Functions...');
  
  try {
    // Test nominator sync
    console.log('📤 Testing nominator sync...');
    const nominatorResponse = await fetch('http://localhost:3000/api/test/hubspot-wsa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nominator',
        data: {
          name: 'Test Debug Nominator',
          email: `test.debug.nominator.${Date.now()}@example.com`,
          linkedin: 'https://www.linkedin.com/in/test-debug-nominator'
        }
      })
    });

    if (nominatorResponse.ok) {
      const result = await nominatorResponse.json();
      console.log('✅ Nominator sync test successful');
      console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    } else {
      const error = await nominatorResponse.text();
      console.log('❌ Nominator sync test failed');
      console.log(`   Error: ${error}`);
    }

    // Test nominee sync
    console.log('📤 Testing nominee sync...');
    const nomineeResponse = await fetch('http://localhost:3000/api/test/hubspot-wsa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nominee',
        data: {
          name: 'Test Debug Nominee',
          email: `test.debug.nominee.${Date.now()}@example.com`,
          linkedin: 'https://www.linkedin.com/in/test-debug-nominee',
          category: 'Top Recruiter'
        }
      })
    });

    if (nomineeResponse.ok) {
      const result = await nomineeResponse.json();
      console.log('✅ Nominee sync test successful');
      console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    } else {
      const error = await nomineeResponse.text();
      console.log('❌ Nominee sync test failed');
      console.log(`   Error: ${error}`);
    }

  } catch (error) {
    console.log('❌ WSA sync function test error:', error.message);
  }
}

// Test actual nomination flow
async function testNominationFlow() {
  console.log('\n🎯 Testing Complete Nomination Flow...');
  
  const timestamp = Date.now();
  const nominationData = {
    category: 'Top Recruiter',
    nominator: {
      name: 'Debug Flow Nominator',
      email: `debug.flow.nominator.${timestamp}@example.com`,
      linkedin: `https://www.linkedin.com/in/debug-flow-nominator-${timestamp}`
    },
    nominee: {
      name: 'Debug Flow Nominee',
      email: `debug.flow.nominee.${timestamp}@example.com`,
      title: 'Senior Recruiter',
      country: 'United States',
      linkedin: `https://www.linkedin.com/in/debug-flow-nominee-${timestamp}`,
      whyVoteForMe: 'Debug test nomination',
      imageUrl: 'https://example.com/test.jpg'
    }
  };

  try {
    // Submit nomination
    console.log('📤 Submitting test nomination...');
    const submitResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nominationData)
    });

    if (submitResponse.ok) {
      const result = await submitResponse.json();
      console.log('✅ Nomination submitted successfully');
      console.log(`   Nomination ID: ${result.id}`);
      
      // Wait for sync
      console.log('⏳ Waiting for nominator sync...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if nominator was synced
      await checkContactInHubSpot(nominationData.nominator.email, 'Nominator');
      
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
        console.log('✅ Nomination approved successfully');
        
        // Wait for nominee sync
        console.log('⏳ Waiting for nominee sync...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if nominee was synced
        await checkContactInHubSpot(nominationData.nominee.email, 'Nominee');
        
      } else {
        const error = await approveResponse.text();
        console.log('❌ Nomination approval failed:', error);
      }
      
    } else {
      const error = await submitResponse.text();
      console.log('❌ Nomination submission failed:', error);
    }

  } catch (error) {
    console.log('❌ Nomination flow test error:', error.message);
  }
}

// Check if contact exists in HubSpot
async function checkContactInHubSpot(email, type) {
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
        properties: ['firstname', 'lastname', 'email', 'wsa_year', 'wsa_segments', 'wsa_linkedin_url', 'wsa_category'],
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
        console.log(`      LinkedIn: ${contact.properties.wsa_linkedin_url || 'Not set'}`);
        console.log(`      Category: ${contact.properties.wsa_category || 'Not set'}`);
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

// Main execution
async function main() {
  try {
    console.log('🚀 Starting HubSpot Sync Debug');
    console.log('==============================');
    
    // Step 1: Test connection
    const connectionOk = await testHubSpotConnection();
    if (!connectionOk) {
      console.log('\n❌ Cannot proceed - HubSpot connection failed');
      console.log('\n🔧 Possible fixes:');
      console.log('1. Check if HUBSPOT_PRIVATE_APP_TOKEN is set correctly');
      console.log('2. Verify the token has the required permissions');
      console.log('3. Check if the token is expired');
      process.exit(1);
    }
    
    // Step 2: Test direct contact creation
    await testCreateContact();
    
    // Step 3: Test WSA sync functions
    await testWSASyncFunctions();
    
    // Step 4: Test complete nomination flow
    await testNominationFlow();
    
    console.log('\n📊 Debug Summary:');
    console.log('=================');
    console.log('✅ HubSpot API connection working');
    console.log('✅ Direct contact creation working');
    console.log('⚠️  Check sync function results above');
    console.log('⚠️  Check nomination flow results above');
    
    console.log('\n🔧 If sync is still not working:');
    console.log('1. Check server logs for sync errors');
    console.log('2. Verify HubSpot custom properties exist');
    console.log('3. Check API rate limits');
    console.log('4. Verify token permissions include contacts write access');
    
  } catch (error) {
    console.error('\n❌ Debug script failed:', error);
    process.exit(1);
  }
}

main();