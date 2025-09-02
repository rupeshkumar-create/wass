#!/usr/bin/env node

/**
 * Simple Vote Sync Test
 * Tests the vote sync API endpoint directly
 */

require('dotenv').config({ path: '.env.local' });

async function testVoteSyncSimple() {
  console.log('🔧 Testing Vote Sync API...');
  
  const testEmail = 'wopare9629@ahanim.com';
  
  try {
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
    
    console.log('Sending vote data to API...');
    
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
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.error('❌ API Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testVoteSyncSimple();