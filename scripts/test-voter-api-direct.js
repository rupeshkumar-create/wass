#!/usr/bin/env node

/**
 * Test Voter API Direct - Test the vote API endpoint to ensure correct tagging
 */

async function testVoterAPI() {
  try {
    console.log('🧪 Testing voter API endpoint with fixed tagging...');

    // Load environment variables
    require('dotenv').config();
    
    const testVoteData = {
      subcategoryId: 'best-staffing-firm-north-america',
      email: 'test.voter.api@example.com',
      firstname: 'Test',
      lastname: 'Voter',
      linkedin: 'https://linkedin.com/in/testvoter',
      company: 'Test Company',
      jobTitle: 'Test Role',
      country: 'United States',
      votedForDisplayName: 'Test Nominee'
    };

    console.log('📤 Submitting test vote via API...');
    console.log('📧 Voter email:', testVoteData.email);

    const response = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testVoteData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Vote API call successful!');
      console.log('📋 Response:', result);
      console.log('\n🏷️ The voter should now be synced to HubSpot with tag "WSA 2026 Voters"');
      console.log('📊 Check HubSpot to verify the contact has the correct tag');
    } else {
      console.error('❌ Vote API call failed:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
testVoterAPI().catch(console.error);