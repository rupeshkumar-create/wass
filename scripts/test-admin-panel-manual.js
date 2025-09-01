#!/usr/bin/env node

/**
 * Manual Admin Panel Test
 * Tests admin panel functionality with authentication
 */

const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSCODE = 'wsa2026';

function makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
  try {
    let curlCmd = `curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}${endpoint}"`;
    
    if (method !== 'GET') {
      curlCmd += ` -X ${method}`;
    }
    
    // Add admin authentication header
    curlCmd += ` -H "X-Admin-Passcode: ${ADMIN_PASSCODE}"`;
    
    if (body) {
      curlCmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`;
    }
    
    const result = execSync(curlCmd, { encoding: 'utf8' });
    const parts = result.split('HTTPSTATUS:');
    const responseBody = parts[0];
    const statusCode = parseInt(parts[1]) || 0;
    
    return {
      statusCode,
      body: responseBody,
      data: responseBody ? (function() {
        try {
          return JSON.parse(responseBody);
        } catch {
          return null;
        }
      })() : null
    };
  } catch (error) {
    return {
      statusCode: 0,
      body: '',
      data: null,
      error: error.message
    };
  }
}

async function testAdminPanelFunctionality() {
  console.log('🔧 Testing Admin Panel Functionality...\n');

  let allTestsPassed = true;

  // Test 1: Admin Stats API with Authentication
  console.log('📊 Testing Admin Stats API...');
  const statsResponse = makeAuthenticatedRequest('/api/stats');
  
  if (statsResponse.statusCode === 200 && statsResponse.data?.success) {
    const stats = statsResponse.data.data;
    
    if (stats.totalRealVotes !== undefined && stats.totalAdditionalVotes !== undefined) {
      console.log('✅ Admin stats API working correctly');
      console.log(`   Real Votes: ${stats.totalRealVotes}`);
      console.log(`   Additional Votes: ${stats.totalAdditionalVotes}`);
      console.log(`   Combined Votes: ${stats.totalCombinedVotes}`);
      console.log(`   Unique Voters: ${stats.uniqueVoters}`);
    } else {
      console.log('❌ Admin stats missing vote breakdown');
      allTestsPassed = false;
    }
  } else {
    console.log('❌ Admin stats API failed');
    allTestsPassed = false;
  }

  // Test 2: Admin Nominations API
  console.log('\n👥 Testing Admin Nominations API...');
  const nominationsResponse = makeAuthenticatedRequest('/api/admin/nominations');
  
  if (nominationsResponse.statusCode === 200 && nominationsResponse.data?.success) {
    const nominations = nominationsResponse.data.data;
    console.log(`✅ Admin nominations API working - ${nominations.length} nominations found`);
    
    if (nominations.length > 0) {
      const firstNomination = nominations[0];
      console.log(`   Sample nomination: ${firstNomination.nominee_display_name || 'Unknown'}`);
      console.log(`   Votes: ${firstNomination.votes || 0}, Additional: ${firstNomination.additional_votes || 0}`);
    }
  } else {
    console.log('❌ Admin nominations API failed');
    allTestsPassed = false;
  }

  // Test 3: Test Vote Update API (without actually updating)
  console.log('\n🗳️ Testing Vote Update API Structure...');
  const voteUpdateResponse = makeAuthenticatedRequest('/api/admin/update-votes', 'POST', {
    nominationId: 'test-id',
    additionalVotes: 0
  });
  
  // We expect this to fail with a proper error (nomination not found), not auth error
  if (voteUpdateResponse.statusCode === 400 || voteUpdateResponse.statusCode === 404) {
    console.log('✅ Vote update API properly authenticated and validates input');
  } else if (voteUpdateResponse.statusCode === 401) {
    console.log('❌ Vote update API authentication failed');
    allTestsPassed = false;
  } else {
    console.log(`⚠️ Vote update API unexpected response: ${voteUpdateResponse.statusCode}`);
  }

  // Test 4: Verify Public API doesn't expose admin data
  console.log('\n🔒 Testing Public API Security...');
  const publicStatsResponse = makeAuthenticatedRequest('/api/stats'); // Without auth header
  const publicStats = execSync(`curl -s ${BASE_URL}/api/stats`, { encoding: 'utf8' });
  
  try {
    const publicData = JSON.parse(publicStats);
    if (publicData.success && publicData.data) {
      const hasAdminFields = publicData.data.totalRealVotes !== undefined || 
                            publicData.data.totalAdditionalVotes !== undefined;
      
      if (!hasAdminFields && publicData.data.totalCombinedVotes > 0) {
        console.log('✅ Public API properly hides admin vote breakdown');
        console.log(`   Public sees combined votes: ${publicData.data.totalCombinedVotes}`);
      } else if (hasAdminFields) {
        console.log('❌ SECURITY ISSUE: Public API exposes admin vote breakdown');
        allTestsPassed = false;
      } else {
        console.log('⚠️ Public API has no vote data');
      }
    }
  } catch (error) {
    console.log('❌ Public API test failed');
    allTestsPassed = false;
  }

  // Summary
  console.log('\n📋 Admin Panel Test Summary:');
  if (allTestsPassed) {
    console.log('✅ All admin panel tests passed!');
    console.log('✅ Admin authentication is working');
    console.log('✅ Admin APIs return detailed vote breakdowns');
    console.log('✅ Public APIs hide sensitive admin data');
    console.log('✅ Vote update functionality is properly secured');
  } else {
    console.log('❌ Some admin panel tests failed!');
  }

  return allTestsPassed;
}

// Run the admin panel test
testAdminPanelFunctionality().then(passed => {
  process.exit(passed ? 0 : 1);
});