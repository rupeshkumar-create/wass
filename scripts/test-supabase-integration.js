#!/usr/bin/env node

/**
 * Test Supabase Integration
 * Verify that all API routes work correctly with Supabase
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase Integration...\n');
  
  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    return;
  }
  
  console.log('✅ Environment variables configured');
  console.log(`   SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey.substring(0, 20)}...`);
  
  // Test 1: Submit person nomination
  console.log('\\n2️⃣ Testing person nomination submission...');
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
    const response = await fetch(`${BASE_URL}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personNomination)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Person nomination submitted successfully');
      console.log(`   Nomination ID: ${result.nominationId}`);
      console.log(`   State: ${result.state}`);
      
      // Test 2: Approve the nomination
      console.log('\\n3️⃣ Testing nomination approval...');
      const approvalData = {
        nominationId: result.nominationId,
        liveUrl: 'https://example.com/nominees/jane-smith'
      };
      
      const approveResponse = await fetch(`${BASE_URL}/api/nomination/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      });
      
      if (approveResponse.ok) {
        const approveResult = await approveResponse.json();
        console.log('✅ Nomination approved successfully');
        console.log(`   Nomination ID: ${approveResult.nominationId}`);
        console.log(`   State: ${approveResult.state}`);
        console.log(`   Live URL: ${approveResult.liveUrl}`);
        
        // Test 3: Cast a vote
        console.log('\\n4️⃣ Testing vote casting...');
        const voteData = {
          email: 'test.voter@example.com',
          firstname: 'Test',
          lastname: 'Voter',
          linkedin: 'https://linkedin.com/in/test-voter',
          subcategoryId: 'top-recruiter',
          votedForDisplayName: 'Jane Smith'
        };
        
        const voteResponse = await fetch(`${BASE_URL}/api/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voteData)
        });
        
        if (voteResponse.ok) {
          const voteResult = await voteResponse.json();
          console.log('✅ Vote cast successfully');
          console.log(`   Voter ID: ${voteResult.voterId}`);
          console.log(`   New vote count: ${voteResult.newVoteCount}`);
          
          // Test 4: Try to vote again (should fail)
          console.log('\\n5️⃣ Testing duplicate vote prevention...');
          const duplicateVoteResponse = await fetch(`${BASE_URL}/api/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voteData)
          });
          
          if (duplicateVoteResponse.status === 409) {
            const duplicateError = await duplicateVoteResponse.json();
            console.log('✅ Duplicate vote prevention working');
            console.log(`   Error: ${duplicateError.error}`);
          } else {
            console.log('❌ Duplicate vote prevention failed');
          }
          
        } else {
          const voteError = await voteResponse.json();
          console.log('❌ Vote casting failed:', voteError);
        }
        
      } else {
        const approveError = await approveResponse.json();
        console.log('❌ Nomination approval failed:', approveError);
      }
      
    } else {
      const error = await response.json();
      console.log('❌ Person nomination submission failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 5: Submit company nomination
  console.log('\\n6️⃣ Testing company nomination submission...');
  const companyNomination = {
    type: 'company',
    categoryGroupId: 'companies',
    subcategoryId: 'best-staffing-firm',
    nominator: {
      email: 'company.nominator@example.com',
      firstname: 'Company',
      lastname: 'Nominator',
      linkedin: 'https://linkedin.com/in/company-nominator',
      nominatedDisplayName: 'Acme Staffing'
    },
    nominee: {
      name: 'Acme Staffing',
      domain: 'acme-staffing.com',
      website: 'https://acme-staffing.com',
      linkedin: 'https://linkedin.com/company/acme-staffing',
      logoUrl: 'https://example.com/logo.png',
      whyUs: 'We are the best staffing firm with excellent service.'
    }
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyNomination)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Company nomination submitted successfully');
      console.log(`   Nomination ID: ${result.nominationId}`);
      console.log(`   State: ${result.state}`);
    } else {
      const error = await response.json();
      console.log('❌ Company nomination submission failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Company nomination test failed:', error.message);
  }
  
  // Test 6: Test sync worker (skeleton)
  console.log('\\n7️⃣ Testing HubSpot sync worker...');
  try {
    const response = await fetch(`${BASE_URL}/api/sync/hubspot/run?limit=5`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-cron-key': process.env.CRON_SECRET || 'dev-secret-key'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ HubSpot sync worker accessible');
      console.log(`   Processed: ${result.processed || 0}`);
      console.log(`   Succeeded: ${result.succeeded || 0}`);
      console.log(`   Failed: ${result.failed || 0}`);
    } else {
      const error = await response.json();
      console.log('❌ HubSpot sync worker failed:', error);
    }
    
  } catch (error) {
    console.log('❌ HubSpot sync worker test failed:', error.message);
  }
  
  console.log('\\n🎉 Supabase integration test completed!');
  console.log('\\n📋 Next steps:');
  console.log('   1. Set up your Supabase project at https://supabase.com');
  console.log('   2. Run the SQL from supabase-schema.sql in Supabase SQL editor');
  console.log('   3. Update .env.local with your Supabase credentials');
  console.log('   4. Run this test again to verify everything works');
  console.log('   5. Update your UI components to call these new API routes');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testSupabaseIntegration();
  }
}

main();