#!/usr/bin/env node

/**
 * Test Form Submission
 * Test the nomination form submission with the correct payload structure
 */

require('dotenv').config({ path: '.env.local' });

async function testFormSubmission() {
  console.log('🧪 Testing Form Submission...\n');
  
  // Test 1: Person nomination
  console.log('1️⃣ Testing person nomination...');
  
  const personPayload = {
    type: 'person',
    categoryGroupId: 'recruiters',
    subcategoryId: 'top-recruiter',
    nominator: {
      email: 'test.nominator@example.com',
      firstname: 'Test',
      lastname: 'Nominator',
      linkedin: 'https://linkedin.com/in/test-nominator',
      nominatedDisplayName: 'Jane Smith'
    },
    nominee: {
      firstname: 'Jane',
      lastname: 'Smith',
      jobtitle: 'Senior Recruiter',
      email: 'jane.smith@example.com',
      linkedin: 'https://linkedin.com/in/jane-smith',
      headshotUrl: 'https://example.com/jane.jpg',
      whyMe: 'I have 10+ years of experience in talent acquisition and have successfully placed over 500 candidates.'
    }
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personPayload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Person nomination successful!');
      console.log(`   Nomination ID: ${result.nominationId}`);
    } else {
      console.log('❌ Person nomination failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('❌ Person nomination error:', error.message);
  }
  
  // Test 2: Company nomination
  console.log('\n2️⃣ Testing company nomination...');
  
  const companyPayload = {
    type: 'company',
    categoryGroupId: 'companies',
    subcategoryId: 'ai-platform',
    nominator: {
      email: 'test.nominator2@example.com',
      firstname: 'Test',
      lastname: 'Nominator2',
      linkedin: 'https://linkedin.com/in/test-nominator2',
      nominatedDisplayName: 'TechCorp Solutions'
    },
    nominee: {
      name: 'TechCorp Solutions',
      website: 'https://techcorp.com',
      linkedin: 'https://linkedin.com/company/techcorp-solutions',
      logoUrl: 'https://example.com/techcorp-logo.jpg',
      whyUs: 'We have revolutionized the recruitment industry with our AI-powered platform that matches candidates 90% faster.'
    }
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyPayload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Company nomination successful!');
      console.log(`   Nomination ID: ${result.nominationId}`);
    } else {
      console.log('❌ Company nomination failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('❌ Company nomination error:', error.message);
  }
  
  // Test 3: Invalid payload (should fail validation)
  console.log('\n3️⃣ Testing invalid payload (should fail)...');
  
  const invalidPayload = {
    type: 'person',
    // Missing required fields
    nominator: {
      email: 'invalid-email' // Invalid email
    }
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload)
    });
    
    const result = await response.json();
    
    if (response.status === 400 || response.status === 422) {
      console.log('✅ Validation working - rejected invalid payload');
      console.log('   Error details:', result.error || result.details);
    } else {
      console.log('⚠️ Unexpected response to invalid payload:', response.status);
    }
  } catch (error) {
    console.log('❌ Invalid payload test error:', error.message);
  }
  
  console.log('\n📊 Form Submission Test Summary:');
  console.log('   - Person nomination payload structure');
  console.log('   - Company nomination payload structure');
  console.log('   - Validation error handling');
  console.log('   - API endpoint connectivity');
}

testFormSubmission();