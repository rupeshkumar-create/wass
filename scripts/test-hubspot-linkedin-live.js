#!/usr/bin/env node

/**
 * Live test for LinkedIn URL syncing to HubSpot
 * This will actually send test data to HubSpot and verify the results
 */

// Load environment variables
require('dotenv').config();

// Use built-in fetch (Node.js 18+) or global fetch

const BASE_URL = 'http://localhost:3000';

// Test data with LinkedIn URLs
const testData = {
  personNomination: {
    id: 'test-person-linkedin-live',
    type: 'person',
    category: 'Recruiter of the Year',
    nominee: {
      name: 'Sarah LinkedIn Live Test',
      linkedin: 'https://linkedin.com/in/sarah-recruiter-live',
      country: 'United States',
      title: 'Senior Recruiter at TechCorp Live'
    },
    liveUrl: '/nominee/sarah-linkedin-live-test'
  },
  
  companyNomination: {
    id: 'test-company-linkedin-live',
    type: 'company',
    category: 'Staffing Company of the Year',
    nominee: {
      name: 'LinkedIn Staffing Live Solutions',
      linkedin: 'https://linkedin.com/company/linkedin-staffing-live',
      website: 'https://linkedinstaffinglive.com',
      country: 'United Kingdom'
    },
    liveUrl: '/nominee/linkedin-staffing-live-solutions'
  },
  
  vote: {
    category: 'Recruiter of the Year',
    nomineeId: 'test-person-linkedin-live'
  },
  
  voter: {
    name: 'Mike LinkedIn Live Voter',
    email: 'mike.voter.live@linkedintest.com',
    linkedin: 'https://linkedin.com/in/mike-voter-hr-live',
    title: 'HR Manager Live',
    company: 'LinkedIn Test Corp Live'
  }
};

async function testServer() {
  console.log('🔍 Checking if development server is running...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/stats`);
    if (response.ok) {
      console.log('✅ Development server is running');
      return true;
    } else {
      console.log('❌ Development server responded with:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Development server is not running');
    console.log('   Please start it with: npm run dev');
    return false;
  }
}

async function syncPersonNominee() {
  console.log('👤 Testing Person Nominee LinkedIn Sync...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/hubspot/sync-nominators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nomination: testData.personNomination,
        action: 'approved'
      })
    });
    
    const result = await response.text();
    
    console.log('Request Data:');
    console.log('  Name:', testData.personNomination.nominee.name);
    console.log('  LinkedIn:', testData.personNomination.nominee.linkedin);
    console.log('  Category:', testData.personNomination.category);
    
    console.log('\nResponse:');
    console.log('  Status:', response.status);
    console.log('  Body:', result);
    
    if (response.ok) {
      console.log('✅ Person nominee sync successful');
      console.log('📋 Expected HubSpot fields:');
      console.log('  - linkedin_url:', testData.personNomination.nominee.linkedin);
      console.log('  - wsa_linkedin_url:', testData.personNomination.nominee.linkedin);
      console.log('  - website:', testData.personNomination.nominee.linkedin);
    } else {
      console.log('❌ Person nominee sync failed');
    }
    
    return response.ok;
    
  } catch (error) {
    console.error('❌ Error syncing person nominee:', error.message);
    return false;
  }
}

async function syncCompanyNominee() {
  console.log('\n🏢 Testing Company Nominee LinkedIn Sync...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/hubspot/sync-nominators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nomination: testData.companyNomination,
        action: 'approved'
      })
    });
    
    const result = await response.text();
    
    console.log('Request Data:');
    console.log('  Name:', testData.companyNomination.nominee.name);
    console.log('  LinkedIn:', testData.companyNomination.nominee.linkedin);
    console.log('  Website:', testData.companyNomination.nominee.website);
    console.log('  Category:', testData.companyNomination.category);
    
    console.log('\nResponse:');
    console.log('  Status:', response.status);
    console.log('  Body:', result);
    
    if (response.ok) {
      console.log('✅ Company nominee sync successful');
      console.log('📋 Expected HubSpot fields:');
      console.log('  - linkedin_url:', testData.companyNomination.nominee.linkedin);
      console.log('  - wsa_linkedin_url:', testData.companyNomination.nominee.linkedin);
    } else {
      console.log('❌ Company nominee sync failed');
    }
    
    return response.ok;
    
  } catch (error) {
    console.error('❌ Error syncing company nominee:', error.message);
    return false;
  }
}

async function syncVoter() {
  console.log('\n🗳️  Testing Voter LinkedIn Sync...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/hubspot/sync-voters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vote: testData.vote,
        voter: testData.voter
      })
    });
    
    const result = await response.text();
    
    console.log('Request Data:');
    console.log('  Name:', testData.voter.name);
    console.log('  Email:', testData.voter.email);
    console.log('  LinkedIn:', testData.voter.linkedin);
    console.log('  Title:', testData.voter.title);
    console.log('  Company:', testData.voter.company);
    
    console.log('\nResponse:');
    console.log('  Status:', response.status);
    console.log('  Body:', result);
    
    if (response.ok) {
      console.log('✅ Voter sync successful');
      console.log('📋 Expected HubSpot fields:');
      console.log('  - linkedin_url:', testData.voter.linkedin);
      console.log('  - wsa_linkedin_url:', testData.voter.linkedin);
      console.log('  - website:', testData.voter.linkedin);
    } else {
      console.log('❌ Voter sync failed');
    }
    
    return response.ok;
    
  } catch (error) {
    console.error('❌ Error syncing voter:', error.message);
    return false;
  }
}

async function verifyHubSpotData() {
  console.log('\n🔍 HubSpot Verification Instructions:\n');
  
  console.log('To verify LinkedIn URLs were synced correctly:');
  console.log('');
  console.log('1. 👤 Check Contact: "Sarah LinkedIn Live Test"');
  console.log('   - Go to HubSpot Contacts');
  console.log('   - Search for "Sarah LinkedIn Live Test"');
  console.log('   - Verify these fields contain: https://linkedin.com/in/sarah-recruiter-live');
  console.log('     • LinkedIn URL (standard field)');
  console.log('     • WSA LinkedIn URL (custom field)');
  console.log('     • Website (fallback field)');
  console.log('');
  
  console.log('2. 🏢 Check Company: "LinkedIn Staffing Live Solutions"');
  console.log('   - Go to HubSpot Companies');
  console.log('   - Search for "LinkedIn Staffing Live Solutions"');
  console.log('   - Verify these fields contain: https://linkedin.com/company/linkedin-staffing-live');
  console.log('     • LinkedIn URL (standard field)');
  console.log('     • WSA LinkedIn URL (custom field)');
  console.log('');
  
  console.log('3. 🗳️  Check Contact: "Mike LinkedIn Live Voter"');
  console.log('   - Go to HubSpot Contacts');
  console.log('   - Search for "Mike LinkedIn Live Voter" or "mike.voter.live@linkedintest.com"');
  console.log('   - Verify these fields contain: https://linkedin.com/in/mike-voter-hr-live');
  console.log('     • LinkedIn URL (standard field)');
  console.log('     • WSA LinkedIn URL (custom field)');
  console.log('     • Website (fallback field)');
  console.log('');
  
  console.log('4. 📊 Additional Notes:');
  console.log('   - If "WSA LinkedIn URL" field doesn\'t exist, create it as a custom property');
  console.log('   - Field type should be "Single-line text"');
  console.log('   - The standard "LinkedIn URL" field should exist by default');
}

async function runLiveTest() {
  console.log('🔗 HubSpot LinkedIn URL Live Sync Test\n');
  console.log('This test will send actual data to your HubSpot account.\n');
  
  // Check if server is running
  const serverRunning = await testServer();
  if (!serverRunning) {
    console.log('\n❌ Cannot proceed without development server');
    console.log('Please run: npm run dev');
    return;
  }
  
  console.log('\n🚀 Starting live sync tests...\n');
  
  // Run all sync tests
  const results = {
    person: await syncPersonNominee(),
    company: await syncCompanyNominee(),
    voter: await syncVoter()
  };
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('  Person Nominee:', results.person ? '✅ SUCCESS' : '❌ FAILED');
  console.log('  Company Nominee:', results.company ? '✅ SUCCESS' : '❌ FAILED');
  console.log('  Voter:', results.voter ? '✅ SUCCESS' : '❌ FAILED');
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Overall: ${successCount}/3 tests passed`);
  
  if (successCount === 3) {
    console.log('\n🎉 All LinkedIn URL sync tests passed!');
    console.log('LinkedIn URLs should now be visible in your HubSpot account.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
  
  // Show verification instructions
  await verifyHubSpotData();
}

// Run the live test
runLiveTest().catch(console.error);