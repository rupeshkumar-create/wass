#!/usr/bin/env node

/**
 * Simple API Test
 * Test the API routes with valid data to ensure database connection works
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing API with valid data...\n');
  
  // Test person nomination
  const personNomination = {
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
      headshotUrl: 'https://example.com/headshot.jpg',
      whyMe: 'I am an excellent recruiter with 10 years of experience.'
    }
  };
  
  try {
    console.log('📤 Submitting person nomination...');
    const response = await fetch(`${BASE_URL}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personNomination)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Person nomination submitted successfully!');
      console.log(`   Nomination ID: ${result.nominationId}`);
      console.log(`   State: ${result.state}`);
      console.log('\n🎉 Database connection is working!');
      console.log('\n📋 Next steps:');
      console.log('   1. Check your Supabase dashboard to see the data');
      console.log('   2. Run the full test: node scripts/test-supabase-integration.js');
    } else {
      console.log('❌ Submission failed:', result);
      
      if (result.error && result.error.includes('relation') && result.error.includes('does not exist')) {
        console.log('\n💡 This error means the database tables haven\'t been created yet.');
        console.log('   Please follow the setup instructions in SETUP_INSTRUCTIONS.md');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

testAPI();