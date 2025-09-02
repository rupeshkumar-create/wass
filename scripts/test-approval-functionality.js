#!/usr/bin/env node

/**
 * Test script to verify approval functionality is working
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testApprovalFunctionality() {
  console.log('🧪 Testing Approval Functionality...\n');

  try {
    // Test 1: Get nominations to find one to approve
    console.log('1️⃣ Fetching nominations...');
    const nominationsResponse = await fetch(`${BASE_URL}/api/admin/nominations-improved`);
    
    if (!nominationsResponse.ok) {
      console.log('❌ Failed to fetch nominations:', nominationsResponse.status);
      return;
    }

    const nominationsData = await nominationsResponse.json();
    
    if (!nominationsData.success || nominationsData.data.length === 0) {
      console.log('⚠️  No nominations found to test with');
      return;
    }

    // Find a submitted nomination to test with
    const submittedNomination = nominationsData.data.find(n => n.state === 'submitted');
    
    if (!submittedNomination) {
      console.log('⚠️  No submitted nominations found to test approval');
      console.log('📊 Available nominations:');
      nominationsData.data.forEach(n => {
        console.log(`   - ${n.displayName || 'Unknown'} (${n.state})`);
      });
      return;
    }

    console.log('✅ Found nomination to test:');
    console.log(`   - ID: ${submittedNomination.id}`);
    console.log(`   - Name: ${submittedNomination.displayName}`);
    console.log(`   - Type: ${submittedNomination.type}`);
    console.log(`   - State: ${submittedNomination.state}`);

    // Test 2: Test approval API
    console.log('\n2️⃣ Testing approval API...');
    
    const approvalResponse = await fetch(`${BASE_URL}/api/nomination/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nominationId: submittedNomination.id,
        action: 'approve',
        adminNotes: 'Test approval from script'
      })
    });

    if (approvalResponse.ok) {
      const approvalData = await approvalResponse.json();
      console.log('✅ Approval API working');
      console.log(`   - Success: ${approvalData.success}`);
      console.log(`   - Live URL: ${approvalData.liveUrl}`);
      console.log(`   - Display Name: ${approvalData.displayName}`);
      console.log(`   - Message: ${approvalData.message}`);
      
      // Check if URL uses localhost
      if (approvalData.liveUrl && approvalData.liveUrl.includes('localhost:3000')) {
        console.log('✅ URL correctly uses localhost for development');
      } else {
        console.log('⚠️  URL might not be using localhost:', approvalData.liveUrl);
      }
    } else {
      const errorData = await approvalResponse.json();
      console.log('❌ Approval API failed:', approvalResponse.status);
      console.log('   Error:', errorData.error);
      console.log('   Details:', errorData.details);
      return;
    }

    // Test 3: Verify nomination was updated
    console.log('\n3️⃣ Verifying nomination was updated...');
    
    const updatedNominationsResponse = await fetch(`${BASE_URL}/api/admin/nominations-improved`);
    const updatedNominationsData = await updatedNominationsResponse.json();
    
    const updatedNomination = updatedNominationsData.data.find(n => n.id === submittedNomination.id);
    
    if (updatedNomination) {
      console.log('✅ Nomination found after approval');
      console.log(`   - State: ${updatedNomination.state}`);
      console.log(`   - Live URL: ${updatedNomination.liveUrl || 'Not set'}`);
      
      if (updatedNomination.state === 'approved') {
        console.log('✅ Nomination successfully approved');
      } else {
        console.log('⚠️  Nomination state not updated to approved');
      }
    } else {
      console.log('❌ Could not find updated nomination');
    }

    console.log('\n🎉 Approval functionality test completed!');
    console.log('\n📋 Summary of fixes:');
    console.log('   ✅ Fixed variable scoping in approval API');
    console.log('   ✅ Fixed callback signatures in admin page');
    console.log('   ✅ Fixed ApprovalDialog to auto-generate URLs');
    console.log('   ✅ Fixed URL generation to use localhost in development');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testApprovalFunctionality();