#!/usr/bin/env node

/**
 * Comprehensive System Test - Final Validation
 * Tests the entire World Staffing Awards application for bugs, security, and logic issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Test result tracking
function logTest(testName, status, details = '', error = null) {
  const result = {
    test: testName,
    status: status, // 'PASS', 'FAIL', 'SKIP'
    details: details,
    error: error,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${statusIcon} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
  if (error) console.log(`   Error: ${error}`);
}

// Helper function to make HTTP requests
function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    let curlCmd = `curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}${endpoint}"`;
    
    if (method !== 'GET') {
      curlCmd += ` -X ${method}`;
    }
    
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

// Test functions
async function testHomePageStats() {
  console.log('\n🏠 Testing Home Page Statistics...');
  
  try {
    const response = makeRequest('/api/stats');
    
    if (response.statusCode === 200 && response.data?.success) {
      const stats = response.data.data;
      
      // Check if combined votes are being returned
      if (typeof stats.totalCombinedVotes === 'number') {
        logTest('Home Page Stats API', 'PASS', `Combined votes: ${stats.totalCombinedVotes}`);
      } else {
        logTest('Home Page Stats API', 'FAIL', 'Missing totalCombinedVotes field');
      }
      
      // Verify no additional votes exposed in public stats
      if (stats.totalAdditionalVotes !== undefined) {
        logTest('Security - Additional Votes Hidden', 'FAIL', 'Additional votes exposed in public API');
      } else {
        logTest('Security - Additional Votes Hidden', 'PASS', 'Additional votes properly hidden');
      }
      
    } else {
      logTest('Home Page Stats API', 'FAIL', `HTTP ${response.statusCode}: ${response.error || 'API error'}`);
    }
  } catch (error) {
    logTest('Home Page Stats API', 'FAIL', '', error.message);
  }
}

async function testNomineesAPI() {
  console.log('\n👥 Testing Nominees API...');
  
  try {
    const response = makeRequest('/api/nominees');
    
    if (response.statusCode === 200 && response.data?.success) {
      const nominees = response.data.data;
      
      if (Array.isArray(nominees) && nominees.length > 0) {
        logTest('Nominees API Response', 'PASS', `Found ${nominees.length} nominees`);
        
        // Check if votes are combined (no separate real/additional fields)
        const firstNominee = nominees[0];
        if (typeof firstNominee.votes === 'number') {
          logTest('Nominees Vote Display', 'PASS', 'Combined votes displayed correctly');
        } else {
          logTest('Nominees Vote Display', 'FAIL', 'Vote count missing or invalid');
        }
        
        // Verify no admin fields exposed
        if (firstNominee.additionalVotes !== undefined || firstNominee.realVotes !== undefined) {
          logTest('Security - Admin Fields Hidden', 'FAIL', 'Admin vote fields exposed in public API');
        } else {
          logTest('Security - Admin Fields Hidden', 'PASS', 'Admin fields properly hidden');
        }
        
      } else {
        logTest('Nominees API Response', 'FAIL', 'No nominees found or invalid response');
      }
    } else {
      logTest('Nominees API Response', 'FAIL', `HTTP ${response.statusCode}: ${response.error || 'API error'}`);
    }
  } catch (error) {
    logTest('Nominees API Response', 'FAIL', '', error.message);
  }
}

async function testAdminAPISecurity() {
  console.log('\n🔒 Testing Admin API Security...');
  
  try {
    // Test admin nominations endpoint without auth
    const response = makeRequest('/api/admin/nominations');
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      logTest('Admin API Security', 'PASS', 'Admin endpoints properly protected');
    } else if (response.statusCode === 200) {
      logTest('Admin API Security', 'FAIL', 'Admin endpoints accessible without authentication');
    } else {
      logTest('Admin API Security', 'SKIP', `Unexpected response: ${response.statusCode}`);
    }
  } catch (error) {
    logTest('Admin API Security', 'FAIL', '', error.message);
  }
}

async function testVoteStatistics() {
  console.log('\n📊 Testing Vote Statistics...');
  
  try {
    const response = makeRequest('/api/stats');
    
    if (response.statusCode === 200 && response.data?.success) {
      const stats = response.data.data;
      
      // Verify vote calculation logic (only for admin API)
      const realVotes = stats.totalRealVotes || 0;
      const additionalVotes = stats.totalAdditionalVotes || 0;
      const combinedVotes = stats.totalCombinedVotes || stats.totalVotes || 0;
      
      // If this is public API (no breakdown), just verify combined votes exist
      if (stats.totalRealVotes === undefined && stats.totalAdditionalVotes === undefined) {
        if (combinedVotes >= 0) {
          logTest('Vote Calculation Logic', 'PASS', `Public API - Combined votes: ${combinedVotes}`);
        } else {
          logTest('Vote Calculation Logic', 'FAIL', `Invalid combined votes: ${combinedVotes}`);
        }
      } else {
        // Admin API - verify math
        if (combinedVotes === realVotes + additionalVotes) {
          logTest('Vote Calculation Logic', 'PASS', `Admin API - Real: ${realVotes}, Additional: ${additionalVotes}, Combined: ${combinedVotes}`);
        } else {
          logTest('Vote Calculation Logic', 'FAIL', `Math error: ${realVotes} + ${additionalVotes} ≠ ${combinedVotes}`);
        }
      }
      
      // Check for reasonable values
      if (combinedVotes >= 0 && realVotes >= 0 && additionalVotes >= 0) {
        logTest('Vote Values Validation', 'PASS', 'All vote counts are non-negative');
      } else {
        logTest('Vote Values Validation', 'FAIL', 'Negative vote counts detected');
      }
      
    } else {
      logTest('Vote Statistics API', 'FAIL', `HTTP ${response.statusCode}: ${response.error || 'API error'}`);
    }
  } catch (error) {
    logTest('Vote Statistics API', 'FAIL', '', error.message);
  }
}

async function testDatabaseConsistency() {
  console.log('\n🗄️ Testing Database Consistency...');
  
  try {
    // Test multiple API calls for consistency
    const calls = [];
    for (let i = 0; i < 3; i++) {
      calls.push(makeRequest('/api/stats'));
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    
    const results = calls.map(call => call.data?.data?.totalCombinedVotes);
    const allSame = results.every(val => val === results[0]);
    
    if (allSame) {
      logTest('Database Consistency', 'PASS', `Consistent vote count: ${results[0]}`);
    } else {
      logTest('Database Consistency', 'FAIL', `Inconsistent results: ${results.join(', ')}`);
    }
    
  } catch (error) {
    logTest('Database Consistency', 'FAIL', '', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...');
  
  try {
    // Test invalid endpoint
    const response = makeRequest('/api/invalid-endpoint-test-123');
    
    if (response.statusCode === 404) {
      logTest('404 Error Handling', 'PASS', 'Invalid endpoints return 404');
    } else if (response.statusCode === 0) {
      logTest('404 Error Handling', 'SKIP', 'Could not test 404 handling (curl issue)');
    } else {
      logTest('404 Error Handling', 'FAIL', `Expected 404, got ${response.statusCode}`);
    }
    
    // Test malformed request
    const malformedResponse = makeRequest('/api/stats', 'POST', { invalid: 'data' });
    
    if (malformedResponse.statusCode >= 400 && malformedResponse.statusCode < 500) {
      logTest('Malformed Request Handling', 'PASS', 'Malformed requests properly rejected');
    } else {
      logTest('Malformed Request Handling', 'FAIL', `Unexpected response: ${malformedResponse.statusCode}`);
    }
    
  } catch (error) {
    logTest('Error Handling', 'FAIL', '', error.message);
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  try {
    const startTime = Date.now();
    const response = makeRequest('/api/stats');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.statusCode === 200) {
      if (responseTime < 2000) { // Less than 2 seconds
        logTest('API Response Time', 'PASS', `Response time: ${responseTime}ms`);
      } else {
        logTest('API Response Time', 'FAIL', `Slow response: ${responseTime}ms`);
      }
    } else {
      logTest('API Response Time', 'FAIL', `API error: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Performance Test', 'FAIL', '', error.message);
  }
}

async function generateTestReport() {
  console.log('\n📋 Generating Test Report...');
  
  const passCount = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failCount = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const skipCount = TEST_RESULTS.filter(r => r.status === 'SKIP').length;
  const totalCount = TEST_RESULTS.length;
  
  const report = {
    summary: {
      total: totalCount,
      passed: passCount,
      failed: failCount,
      skipped: skipCount,
      successRate: totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0
    },
    timestamp: new Date().toISOString(),
    results: TEST_RESULTS
  };
  
  // Write report to file
  const reportPath = path.join(__dirname, '..', 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   Total Tests: ${totalCount}`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏭️ Skipped: ${skipCount}`);
  console.log(`   Success Rate: ${report.summary.successRate}%`);
  
  if (failCount > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.filter(r => r.status === 'FAIL').forEach(test => {
      console.log(`   - ${test.test}: ${test.error || test.details}`);
    });
  }
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return report.summary.successRate === 100;
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive System Tests...\n');
  console.log('🎯 Testing World Staffing Awards Application');
  console.log('🔍 Checking for bugs, security issues, and logic breaks\n');
  
  try {
    // Check if server is running
    const healthCheck = makeRequest('/api/stats');
    if (healthCheck.statusCode !== 200) {
      console.log('❌ Server not responding. Please start the development server first.');
      console.log('   Run: npm run dev');
      process.exit(1);
    }
    
    // Run all tests
    await testHomePageStats();
    await testNomineesAPI();
    await testAdminAPISecurity();
    await testVoteStatistics();
    await testDatabaseConsistency();
    await testErrorHandling();
    await testPerformance();
    
    // Generate report
    const allTestsPassed = await generateTestReport();
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed. Please review and fix issues before proceeding.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runComprehensiveTests();