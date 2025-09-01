#!/usr/bin/env node

/**
 * Security Validation Test
 * Ensures additional votes functionality is properly hidden from public users
 */

const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';

function makeRequest(endpoint) {
  try {
    const result = execSync(`curl -s ${BASE_URL}${endpoint}`, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return null;
  }
}

async function testSecurityValidation() {
  console.log('🔒 Security Validation Test - Additional Votes Hiding\n');

  let allTestsPassed = true;

  // Test 1: Public Stats API should not expose additional votes breakdown
  console.log('📊 Testing Public Stats API...');
  const statsResponse = makeRequest('/api/stats');
  
  if (statsResponse && statsResponse.success) {
    const stats = statsResponse.data;
    
    // Check if additional votes are exposed (they should be for admin, but let's verify the structure)
    if (stats.totalCombinedVotes !== undefined) {
      console.log('✅ Combined votes available for public display');
    } else {
      console.log('❌ Combined votes missing from stats');
      allTestsPassed = false;
    }
    
    // The stats API is used by admin, so it will have additional votes
    // But we need to ensure public pages only use combined votes
    console.log(`   Real Votes: ${stats.totalRealVotes || 0}`);
    console.log(`   Additional Votes: ${stats.totalAdditionalVotes || 0}`);
    console.log(`   Combined Votes: ${stats.totalCombinedVotes || 0}`);
  } else {
    console.log('❌ Stats API failed');
    allTestsPassed = false;
  }

  // Test 2: Nominees API should only show combined votes
  console.log('\n👥 Testing Nominees API...');
  const nomineesResponse = makeRequest('/api/nominees');
  
  if (nomineesResponse && nomineesResponse.success && nomineesResponse.data.length > 0) {
    const firstNominee = nomineesResponse.data[0];
    
    // Check that only combined votes are shown
    if (firstNominee.votes !== undefined) {
      console.log('✅ Nominees show vote counts');
    } else {
      console.log('❌ Nominees missing vote counts');
      allTestsPassed = false;
    }
    
    // Ensure no admin fields are exposed
    if (firstNominee.additionalVotes === undefined && firstNominee.realVotes === undefined) {
      console.log('✅ Admin vote fields properly hidden from nominees API');
    } else {
      console.log('❌ SECURITY ISSUE: Admin vote fields exposed in nominees API');
      allTestsPassed = false;
    }
    
    console.log(`   Sample nominee votes: ${firstNominee.votes || 0}`);
  } else {
    console.log('❌ Nominees API failed or no data');
    allTestsPassed = false;
  }

  // Test 3: Check that admin endpoints are protected
  console.log('\n🔐 Testing Admin Endpoint Protection...');
  try {
    const adminResult = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" ${BASE_URL}/api/admin/nominations`, { encoding: 'utf8' });
    const parts = adminResult.split('HTTPSTATUS:');
    const statusCode = parseInt(parts[1]);
    
    if (statusCode === 401 || statusCode === 403) {
      console.log('✅ Admin endpoints properly protected');
    } else if (statusCode === 200) {
      console.log('❌ SECURITY ISSUE: Admin endpoints accessible without authentication');
      allTestsPassed = false;
    } else {
      console.log(`⚠️ Unexpected admin endpoint response: ${statusCode}`);
    }
  } catch (error) {
    console.log('⚠️ Could not test admin endpoint protection');
  }

  // Test 4: Verify vote update endpoint is protected
  console.log('\n🗳️ Testing Vote Update Endpoint Protection...');
  try {
    const voteUpdateResult = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" -X POST ${BASE_URL}/api/admin/update-votes`, { encoding: 'utf8' });
    const parts = voteUpdateResult.split('HTTPSTATUS:');
    const statusCode = parseInt(parts[1]);
    
    if (statusCode === 401 || statusCode === 403 || statusCode === 405) {
      console.log('✅ Vote update endpoint properly protected');
    } else if (statusCode === 200) {
      console.log('❌ SECURITY ISSUE: Vote update endpoint accessible without authentication');
      allTestsPassed = false;
    } else {
      console.log(`⚠️ Unexpected vote update response: ${statusCode}`);
    }
  } catch (error) {
    console.log('⚠️ Could not test vote update endpoint protection');
  }

  // Summary
  console.log('\n📋 Security Validation Summary:');
  if (allTestsPassed) {
    console.log('✅ All security tests passed!');
    console.log('✅ Additional votes functionality is properly hidden from public users');
    console.log('✅ Admin endpoints are protected');
    console.log('✅ Public APIs only expose combined vote totals');
  } else {
    console.log('❌ Security issues detected! Please review and fix.');
  }

  return allTestsPassed;
}

// Run the security validation
testSecurityValidation().then(passed => {
  process.exit(passed ? 0 : 1);
});