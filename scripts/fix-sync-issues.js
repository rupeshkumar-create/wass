#!/usr/bin/env node

/**
 * Comprehensive Sync Fix Script
 * Fixes all HubSpot and Loops sync issues
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

console.log('🔧 Comprehensive Sync Fix Script');
console.log('==================================');

// Configuration
const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN;
const LOOPS_API_KEY = process.env.LOOPS_API_KEY;

console.log('📋 Configuration Check:');
console.log(`   HubSpot Token: ${HUBSPOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   Loops API Key: ${LOOPS_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log('');

// Test data for comprehensive sync verification
const testData = {
  nominator: {
    name: 'John Test Nominator',
    email: `test.nominator.${Date.now()}@example.com`,
    phone: '+1234567890',
    linkedin: 'https://www.linkedin.com/in/john-test-nominator'
  },
  nominee: {
    name: 'Jane Test Nominee',
    email: `test.nominee.${Date.now()}@example.com`,
    linkedin: 'https://www.linkedin.com/in/jane-test-nominee',
    category: 'Top Recruiter'
  },
  voter: {
    firstName: 'Bob',
    lastName: 'Test Voter',
    email: `test.voter.${Date.now()}@example.com`,
    phone: '+1234567891',
    linkedin: 'https://www.linkedin.com/in/bob-test-voter'
  }
};

// HubSpot API Helper
async function hubspotRequest(endpoint, options = {}) {
  if (!HUBSPOT_TOKEN) {
    throw new Error('HubSpot token not configured');
  }

  const response = await fetch(`https://api.hubapi.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot API error: ${response.status} - ${error}`);
  }

  return response.status === 204 ? null : response.json();
}

// Loops API Helper
async function loopsRequest(endpoint, data) {
  if (!LOOPS_API_KEY) {
    throw new Error('Loops API key not configured');
  }

  const response = await fetch(`https://app.loops.so/api/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOOPS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  
  if (!response.ok) {
    // Handle 409 for existing contacts
    if (response.status === 409 && endpoint === '/contacts/create') {
      console.log('   Contact exists, switching to update');
      return loopsRequest('/contacts/update', data);
    }
    throw new Error(`Loops API error: ${response.status} - ${JSON.stringify(result)}`);
  }

  return result;
}

// HubSpot Sync Functions
async function syncNominatorToHubSpot(nominator) {
  console.log('🔄 Syncing nominator to HubSpot...');
  
  const nameParts = nominator.name.split(' ');
  const properties = {
    firstname: nameParts[0] || 'Nominator',
    lastname: nameParts.slice(1).join(' ') || '',
    email: nominator.email,
    phone: nominator.phone,
    wsa_year: '2026',
    wsa_segments: 'nominators_2026',
    linkedin_url: nominator.linkedin
  };

  // Try to find existing contact
  const searchResult = await hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: nominator.email
        }]
      }],
      properties: ['email', 'wsa_segments'],
      limit: 1
    })
  });

  if (searchResult.results && searchResult.results.length > 0) {
    // Update existing
    const contactId = searchResult.results[0].id;
    const existingSegments = searchResult.results[0].properties.wsa_segments || '';
    const segments = existingSegments.split(';').filter(s => s.trim());
    if (!segments.includes('nominators_2026')) {
      segments.push('nominators_2026');
      properties.wsa_segments = segments.join(';');
    }
    
    await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
    console.log('   ✅ Updated existing nominator contact');
  } else {
    // Create new
    await hubspotRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
    console.log('   ✅ Created new nominator contact');
  }
}

async function syncNomineeToHubSpot(nominee) {
  console.log('🔄 Syncing nominee to HubSpot...');
  
  const nameParts = nominee.name.split(' ');
  const properties = {
    firstname: nameParts[0] || 'Nominee',
    lastname: nameParts.slice(1).join(' ') || '',
    email: nominee.email,
    wsa_year: '2026',
    wsa_segments: 'nominees_2026', // Use the internal value, not display label
    wsa_category: nominee.category,
    linkedin_url: nominee.linkedin
  };

  // Try to find existing contact
  const searchResult = await hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: nominee.email
        }]
      }],
      properties: ['email', 'wsa_segments'],
      limit: 1
    })
  });

  if (searchResult.results && searchResult.results.length > 0) {
    // Update existing
    const contactId = searchResult.results[0].id;
    const existingSegments = searchResult.results[0].properties.wsa_segments || '';
    const segments = existingSegments.split(';').filter(s => s.trim());
    if (!segments.includes('nominees_2026')) {
      segments.push('nominees_2026');
      properties.wsa_segments = segments.join(';');
    }
    
    await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
    console.log('   ✅ Updated existing nominee contact');
  } else {
    // Create new
    await hubspotRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
    console.log('   ✅ Created new nominee contact');
  }
}

async function syncVoterToHubSpot(voter) {
  console.log('🔄 Syncing voter to HubSpot...');
  
  const properties = {
    firstname: voter.firstName,
    lastname: voter.lastName,
    email: voter.email,
    phone: voter.phone,
    wsa_year: '2026',
    wsa_segments: 'voters_2026', // Use the internal value, not display label
    linkedin_url: voter.linkedin,
    wsa_last_voted_category: 'Top Recruiter'
  };

  // Try to find existing contact
  const searchResult = await hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: voter.email
        }]
      }],
      properties: ['email', 'wsa_segments'],
      limit: 1
    })
  });

  if (searchResult.results && searchResult.results.length > 0) {
    // Update existing
    const contactId = searchResult.results[0].id;
    const existingSegments = searchResult.results[0].properties.wsa_segments || '';
    const segments = existingSegments.split(';').filter(s => s.trim());
    if (!segments.includes('voters_2026')) {
      segments.push('voters_2026');
      properties.wsa_segments = segments.join(';');
    }
    
    await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
    console.log('   ✅ Updated existing voter contact');
  } else {
    // Create new
    await hubspotRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
    console.log('   ✅ Created new voter contact');
  }
}

// Loops Sync Functions
async function syncNominatorToLoops(nominator) {
  console.log('🔄 Syncing nominator to Loops...');
  
  const nameParts = nominator.name.split(' ');
  const contactData = {
    email: nominator.email,
    firstName: nameParts[0] || 'Nominator',
    lastName: nameParts.slice(1).join(' ') || '',
    userGroup: 'Nominator 2026',
    source: 'WSA 2026 Nominations'
  };

  await loopsRequest('/contacts/update', contactData);
  console.log('   ✅ Synced nominator to Loops');
}

async function syncNomineeToLoops(nominee) {
  console.log('🔄 Syncing nominee to Loops...');
  
  const nameParts = nominee.name.split(' ');
  const contactData = {
    email: nominee.email,
    firstName: nameParts[0] || 'Nominee',
    lastName: nameParts.slice(1).join(' ') || '',
    userGroup: 'Nominees 2026',
    source: 'WSA 2026 Nominations'
  };

  await loopsRequest('/contacts/update', contactData);
  console.log('   ✅ Synced nominee to Loops');
}

async function syncVoterToLoops(voter) {
  console.log('🔄 Syncing voter to Loops...');
  
  const contactData = {
    email: voter.email,
    firstName: voter.firstName,
    lastName: voter.lastName,
    userGroup: 'Voter 2026',
    source: 'WSA 2026 Voting'
  };

  await loopsRequest('/contacts/update', contactData);
  console.log('   ✅ Synced voter to Loops');
}

// Verification Functions
async function verifyHubSpotSync(email, expectedSegment) {
  const searchResult = await hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: email
        }]
      }],
      properties: ['firstname', 'lastname', 'wsa_year', 'wsa_segments', 'linkedin_url', 'wsa_category'],
      limit: 1
    })
  });

  if (searchResult.results && searchResult.results.length > 0) {
    const contact = searchResult.results[0];
    const segments = contact.properties.wsa_segments || '';
    const hasCorrectSegment = segments.includes(expectedSegment);
    
    console.log(`   ✅ Found in HubSpot`);
    console.log(`      👤 Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
    console.log(`      📅 WSA Year: ${contact.properties.wsa_year}`);
    console.log(`      🏷️  WSA Segments: ${segments}`);
    console.log(`      🔗 LinkedIn: ${contact.properties.linkedin_url || 'Not set'}`);
    console.log(`      📂 Category: ${contact.properties.wsa_category || 'Not set'}`);
    console.log(`      ${hasCorrectSegment ? '✅' : '❌'} Correct segment: ${expectedSegment}`);
    
    return hasCorrectSegment;
  } else {
    console.log(`   ❌ Not found in HubSpot`);
    return false;
  }
}

async function verifyLoopsSync(email, expectedUserGroup) {
  try {
    if (!LOOPS_API_KEY) {
      console.log(`   ❌ Loops API key not configured`);
      return false;
    }

    const response = await fetch(`https://app.loops.so/api/v1/contacts/find`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      console.log(`   ❌ Loops API error: ${response.status}`);
      return false;
    }

    const text = await response.text();
    if (!text.trim()) {
      console.log(`   ❌ Not found in Loops (empty response)`);
      return false;
    }

    const result = JSON.parse(text);
    
    if (result && result.length > 0) {
      const contact = result[0];
      const hasCorrectGroup = contact.userGroup === expectedUserGroup;
      
      console.log(`   ✅ Found in Loops`);
      console.log(`      👤 Name: ${contact.firstName} ${contact.lastName}`);
      console.log(`      🏷️  User Group: ${contact.userGroup}`);
      console.log(`      📅 Source: ${contact.source || 'Not set'}`);
      console.log(`      ${hasCorrectGroup ? '✅' : '❌'} Correct user group: ${expectedUserGroup}`);
      
      return hasCorrectGroup;
    } else {
      console.log(`   ❌ Not found in Loops`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking Loops: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Comprehensive Sync Fix');
    console.log('===================================');
    
    // Step 1: Test HubSpot Sync
    console.log('\n1. Testing HubSpot Sync...');
    await syncNominatorToHubSpot(testData.nominator);
    await syncNomineeToHubSpot(testData.nominee);
    await syncVoterToHubSpot(testData.voter);
    
    // Step 2: Test Loops Sync
    console.log('\n2. Testing Loops Sync...');
    await syncNominatorToLoops(testData.nominator);
    await syncNomineeToLoops(testData.nominee);
    await syncVoterToLoops(testData.voter);
    
    // Step 3: Wait for sync to complete
    console.log('\n3. Waiting for sync to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Verify HubSpot Sync
    console.log('\n4. Verifying HubSpot Sync...');
    console.log(`🔍 Checking Nominator: ${testData.nominator.email}`);
    const hubspotNominator = await verifyHubSpotSync(testData.nominator.email, 'nominators_2026');
    
    console.log(`🔍 Checking Nominee: ${testData.nominee.email}`);
    const hubspotNominee = await verifyHubSpotSync(testData.nominee.email, 'nominees_2026');
    
    console.log(`🔍 Checking Voter: ${testData.voter.email}`);
    const hubspotVoter = await verifyHubSpotSync(testData.voter.email, 'voters_2026');
    
    // Step 5: Verify Loops Sync
    console.log('\n5. Verifying Loops Sync...');
    console.log(`🔍 Checking Nominator: ${testData.nominator.email}`);
    const loopsNominator = await verifyLoopsSync(testData.nominator.email, 'Nominator 2026');
    
    console.log(`🔍 Checking Nominee: ${testData.nominee.email}`);
    const loopsNominee = await verifyLoopsSync(testData.nominee.email, 'Nominees 2026');
    
    console.log(`🔍 Checking Voter: ${testData.voter.email}`);
    const loopsVoter = await verifyLoopsSync(testData.voter.email, 'Voter 2026');
    
    // Results
    console.log('\n📊 Sync Fix Results:');
    console.log('====================');
    
    const hubspotSuccess = hubspotNominator && hubspotNominee && hubspotVoter;
    const loopsSuccess = loopsNominator && loopsNominee && loopsVoter;
    
    console.log(`${hubspotSuccess ? '✅' : '❌'} HubSpot Sync: ${hubspotSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`${loopsSuccess ? '✅' : '❌'} Loops Sync: ${loopsSuccess ? 'PASS' : 'FAIL'}`);
    
    const overallSuccess = hubspotSuccess && loopsSuccess;
    console.log(`🎯 Overall Result: ${overallSuccess ? '✅ ALL SYNCS WORKING' : '⚠️  SOME SYNCS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Sync fix successful!');
      console.log('✅ All contacts are properly synced to HubSpot with correct segments');
      console.log('✅ All contacts are properly synced to Loops with correct user groups');
    } else {
      console.log('\n⚠️  Some sync operations failed.');
      console.log('Please check the detailed results above and:');
      console.log('1. Verify API keys have correct permissions');
      console.log('2. Check network connectivity');
      console.log('3. Review error logs for specific issues');
    }
    
    console.log('\n📋 Test Contacts Created:');
    console.log(`   Nominator: ${testData.nominator.email}`);
    console.log(`   Nominee: ${testData.nominee.email}`);
    console.log(`   Voter: ${testData.voter.email}`);
    
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Sync fix failed:', error);
    process.exit(1);
  }
}

main();