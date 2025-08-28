#!/usr/bin/env node

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testAPI(endpoint, options = {}) {
  try {
    console.log(`🔄 Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ ${endpoint} failed:`, data);
      return { success: false, error: data };
    }

    console.log(`✅ ${endpoint} success:`, {
      status: response.status,
      dataCount: Array.isArray(data.data) ? data.data.length : 'N/A',
      success: data.success
    });

    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${endpoint} error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testNewSchemaAPIs() {
  console.log('🧪 Testing APIs with new schema...\n');

  // Test 1: Get all nominees
  await testAPI('/api/nominees');

  // Test 2: Get nominees by category
  await testAPI('/api/nominees?subcategoryId=top-recruiter');

  // Test 3: Get admin nominations
  await testAPI('/api/admin/nominations');

  // Test 4: Get admin nominations by status
  await testAPI('/api/admin/nominations?status=approved');

  // Test 5: Submit a test nomination (person)
  const personNomination = {
    type: 'person',
    categoryGroupId: 'individual-awards',
    subcategoryId: 'top-recruiter',
    nominator: {
      email: 'test.nominator@example.com',
      firstname: 'Test',
      lastname: 'Nominator',
      linkedin: 'https://linkedin.com/in/testnominator',
      company: 'Test Company',
      jobTitle: 'HR Manager',
      phone: '+1-555-0123',
      country: 'USA'
    },
    nominee: {
      firstname: 'Test',
      lastname: 'Nominee',
      email: 'test.nominee@example.com',
      linkedin: 'https://linkedin.com/in/testnominee',
      phone: '+1-555-0124',
      jobtitle: 'Senior Recruiter',
      company: 'Nominee Company',
      country: 'USA',
      headshotUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      whyMe: 'I am an exceptional recruiter with proven results.',
      liveUrl: 'https://testnominee.example.com',
      bio: 'Experienced recruiter',
      achievements: 'Multiple industry awards'
    }
  };

  await testAPI('/api/nomination/submit', {
    method: 'POST',
    body: JSON.stringify(personNomination)
  });

  // Test 6: Submit a test nomination (company)
  const companyNomination = {
    type: 'company',
    categoryGroupId: 'company-awards',
    subcategoryId: 'best-recruitment-agency',
    nominator: {
      email: 'test.nominator2@example.com',
      firstname: 'Test2',
      lastname: 'Nominator2',
      linkedin: 'https://linkedin.com/in/testnominator2',
      company: 'Test Company 2',
      jobTitle: 'CEO',
      phone: '+1-555-0125',
      country: 'USA'
    },
    nominee: {
      name: 'Test Recruitment Agency',
      domain: 'testrecruit.com',
      website: 'https://testrecruit.com',
      linkedin: 'https://linkedin.com/company/testrecruit',
      phone: '+1-555-0126',
      country: 'USA',
      size: '50-100',
      industry: 'Recruitment',
      logoUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
      whyUs: 'We are the leading recruitment agency with innovative solutions.',
      liveUrl: 'https://testrecruit.com',
      bio: 'Leading recruitment agency',
      achievements: 'Industry leader with multiple certifications'
    }
  };

  await testAPI('/api/nomination/submit', {
    method: 'POST',
    body: JSON.stringify(companyNomination)
  });

  // Test 7: Cast a vote
  const voteData = {
    subcategoryId: 'top-recruiter',
    email: 'test.voter@example.com',
    firstname: 'Test',
    lastname: 'Voter',
    linkedin: 'https://linkedin.com/in/testvoter',
    company: 'Voter Company',
    jobTitle: 'HR Director',
    country: 'USA',
    votedForDisplayName: 'Person1 LastName1' // From test data
  };

  await testAPI('/api/vote', {
    method: 'POST',
    body: JSON.stringify(voteData)
  });

  // Test 8: Update nomination status (admin)
  const updateData = {
    nominationId: 'test-id', // This will fail but we can see the error handling
    state: 'approved',
    liveUrl: 'https://updated.example.com'
  };

  await testAPI('/api/admin/nominations', {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });

  console.log('\n🎉 API testing completed!');
}

if (require.main === module) {
  testNewSchemaAPIs();
}

module.exports = { testNewSchemaAPIs };