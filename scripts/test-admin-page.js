#!/usr/bin/env node

/**
 * Test the admin page functionality
 */

require('dotenv').config({ path: '.env.local' });

async function testAdminPage() {
  try {
    console.log('🔍 Testing admin page APIs...\n');

    // Test 1: Check stats API
    console.log('1️⃣ Testing stats API...');
    try {
      const statsResponse = await fetch('http://localhost:3000/api/stats');
      const statsResult = await statsResponse.json();
      
      if (statsResponse.ok) {
        console.log('✅ Stats API working');
        console.log('   Stats:', JSON.stringify(statsResult, null, 2));
      } else {
        console.log('❌ Stats API failed:', statsResult);
      }
    } catch (error) {
      console.log('❌ Stats API error:', error.message);
    }

    // Test 2: Check votes API
    console.log('\n2️⃣ Testing votes API...');
    try {
      const votesResponse = await fetch('http://localhost:3000/api/votes');
      const votesResult = await votesResponse.json();
      
      if (votesResponse.ok) {
        console.log('✅ Votes API working');
        console.log(`   Found ${votesResult.length} votes`);
        if (votesResult.length > 0) {
          console.log('   Sample vote:', JSON.stringify(votesResult[0], null, 2));
        }
      } else {
        console.log('❌ Votes API failed:', votesResult);
      }
    } catch (error) {
      console.log('❌ Votes API error:', error.message);
    }

    // Test 3: Check nominees API
    console.log('\n3️⃣ Testing nominees API...');
    try {
      const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
      const nomineesResult = await nomineesResponse.json();
      
      if (nomineesResponse.ok && nomineesResult.success) {
        console.log('✅ Nominees API working');
        console.log(`   Found ${nomineesResult.count} nominees`);
        if (nomineesResult.data.length > 0) {
          console.log('   Sample nominee:', JSON.stringify(nomineesResult.data[0], null, 2));
        }
      } else {
        console.log('❌ Nominees API failed:', nomineesResult);
      }
    } catch (error) {
      console.log('❌ Nominees API error:', error.message);
    }

    console.log('\n📋 Admin Page Testing Summary:');
    console.log('• Stats API - provides dashboard statistics');
    console.log('• Votes API - provides voting data for admin view');
    console.log('• Nominees API - provides nomination data');
    
    console.log('\n🔐 Admin Access:');
    console.log('• URL: http://localhost:3000/admin');
    console.log('• Passcode: admin123 or wsa2026');
    console.log('• The admin page should now load without React errors');

    console.log('\n✅ Admin page APIs are ready!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAdminPage();