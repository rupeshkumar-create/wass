#!/usr/bin/env node

/**
 * Debug form submission error
 * Test the nomination submission API directly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugFormSubmission() {
  console.log('🔍 Debugging form submission error');
  console.log('='.repeat(50));

  try {
    // Test data that matches the form structure
    const testNominationData = {
      type: 'person',
      categoryGroupId: 'individual-awards',
      subcategoryId: 'top-recruiter',
      nominator: {
        firstname: 'Test',
        lastname: 'Nominator',
        email: 'test-nominator@example.com',
        linkedin: 'https://linkedin.com/in/test-nominator',
        company: 'Test Company',
        jobTitle: 'HR Manager',
        phone: '+1234567890',
        country: 'United States'
      },
      nominee: {
        firstname: 'Test',
        lastname: 'Nominee',
        email: 'test-nominee@example.com',
        linkedin: 'https://linkedin.com/in/test-nominee',
        jobtitle: 'Senior Recruiter',
        company: 'Nominee Company',
        phone: '+0987654321',
        country: 'Canada',
        headshotUrl: 'https://example.com/headshot.jpg',
        whyMe: 'Test reason for nomination',
        liveUrl: 'https://example.com/portfolio',
        bio: 'Test bio',
        achievements: 'Test achievements'
      }
    };

    console.log('\n1. Testing nomination submission API...');
    console.log('Data to submit:', JSON.stringify(testNominationData, null, 2));

    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNominationData)
    });

    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Submission successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Submission failed');
      console.log('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (parseError) {
        console.log('Could not parse error as JSON');
      }
    }

    // 2. Test HubSpot sync directly
    console.log('\n2. Testing HubSpot sync directly...');
    
    const hubspotTestResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    if (hubspotTestResponse.ok) {
      const hubspotResult = await hubspotTestResponse.json();
      console.log('✅ HubSpot connection test:', hubspotResult.success ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('❌ HubSpot connection test failed:', await hubspotTestResponse.text());
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugFormSubmission().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});