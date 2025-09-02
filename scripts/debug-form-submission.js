#!/usr/bin/env node

/**
 * Debug Form Submission
 * Test the exact payload the form would send and see what error occurs
 */

require('dotenv').config({ path: '.env.local' });

async function debugFormSubmission() {
  console.log('🔍 Debugging Form Submission Error...\n');
  
  // Simulate the exact payload structure the form would create
  console.log('1️⃣ Testing with minimal valid payload...');
  
  const minimalPayload = {
    type: 'person',
    categoryGroupId: 'general',
    subcategoryId: 'test-category',
    nominator: {
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
      nominatedDisplayName: 'Test Nominee'
    },
    nominee: {
      firstname: 'Test',
      lastname: 'Nominee',
      jobtitle: 'Test Job',
      email: 'nominee@example.com',
      linkedin: 'https://linkedin.com/in/test-nominee',
      whyMe: 'Test reason'
    }
  };
  
  console.log('Payload:', JSON.stringify(minimalPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text(); // Get as text first
    console.log('Raw response:', result);
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('Parsed JSON:', jsonResult);
    } catch (parseError) {
      console.log('Failed to parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('Error details:', error);
  }
  
  // Test 2: Check if the API endpoint exists
  console.log('\n2️⃣ Testing API endpoint availability...');
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'GET'
    });
    
    console.log('GET response status:', response.status);
    
    if (response.status === 405) {
      console.log('✅ Endpoint exists (Method Not Allowed for GET is expected)');
    } else {
      console.log('⚠️ Unexpected response for GET request');
    }
  } catch (error) {
    console.log('❌ Endpoint availability error:', error.message);
  }
  
  // Test 3: Test with form-like payload structure
  console.log('\n3️⃣ Testing with form-like payload...');
  
  const formLikePayload = {
    type: 'person',
    categoryGroupId: 'general', // This might be the issue - could be undefined
    subcategoryId: '', // This might be empty
    nominator: {
      email: 'form-test@example.com',
      firstname: 'Form',
      lastname: 'Test',
      nominatedDisplayName: '' // This might be empty
    },
    nominee: {
      firstname: '',
      lastname: '',
      jobtitle: '',
      email: '',
      linkedin: '',
      whyMe: ''
    }
  };
  
  console.log('Form-like payload:', JSON.stringify(formLikePayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formLikePayload)
    });
    
    const result = await response.text();
    console.log('Form-like response status:', response.status);
    console.log('Form-like response:', result);
    
  } catch (error) {
    console.log('❌ Form-like payload error:', error.message);
  }
  
  console.log('\n📊 Debug Summary:');
  console.log('   - Check if API endpoint is reachable');
  console.log('   - Verify payload structure matches schema');
  console.log('   - Look for validation errors');
  console.log('   - Check for empty/undefined values');
}

debugFormSubmission();