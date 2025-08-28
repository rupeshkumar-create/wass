#!/usr/bin/env node

/**
 * Debug Sync Error
 * Get detailed error information from sync endpoints
 */

require('dotenv').config({ path: '.env.local' });

async function debugSyncError() {
  console.log('🔍 Debugging HubSpot Sync Errors...');
  
  try {
    // Test nomination submit with detailed error logging
    console.log('\n1️⃣ Testing Nomination Submit...');
    await debugNominationSubmit();
    
    // Test vote with detailed error logging
    console.log('\n2️⃣ Testing Vote...');
    await debugVote();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function debugNominationSubmit() {
  const nominationData = {
    nominator: {
      email: 'debug.nominator@example.com',
      name: 'Debug Nominator',
      company: 'Debug Corp',
      linkedin: 'https://linkedin.com/in/debug-nominator'
    },
    nominee: {
      name: 'Debug Nominee',
      type: 'person',
      linkedin: 'https://linkedin.com/in/debug-nominee',
      email: 'debug.nominee@example.com',
      firstName: 'Debug',
      lastName: 'Nominee',
      title: 'Debug Manager',
      whyVoteForMe: 'I debug everything perfectly.'
    },
    category: 'top-recruiter',
    categoryGroupId: 'top',
    subcategoryId: 'top-recruiter',
    whyNominated: 'They debug everything perfectly and never break production.',
    imageUrl: 'https://example.com/debug-photo.jpg'
  };
  
  console.log('Sending nomination data:', JSON.stringify(nominationData, null, 2));
  
  const response = await fetch('http://localhost:3000/api/sync/hubspot/nomination-submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nominationData)
  });
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('Response body:', responseText);
  
  try {
    const responseJson = JSON.parse(responseText);
    console.log('Parsed response:', JSON.stringify(responseJson, null, 2));
  } catch (e) {
    console.log('Could not parse response as JSON');
  }
}

async function debugVote() {
  const voteData = {
    voter: {
      email: 'debug.voter@example.com',
      firstName: 'Debug',
      lastName: 'Voter',
      company: 'Debug Industries',
      linkedin: 'https://linkedin.com/in/debug-voter'
    },
    nominee: {
      id: 'debug-nominee-123',
      name: 'Debug Nominee',
      type: 'person',
      linkedin: 'https://linkedin.com/in/debug-nominee',
      email: 'debug.nominee@example.com'
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
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('Response body:', responseText);
  
  try {
    const responseJson = JSON.parse(responseText);
    console.log('Parsed response:', JSON.stringify(responseJson, null, 2));
  } catch (e) {
    console.log('Could not parse response as JSON');
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
    await debugSyncError();
  }
}

main();