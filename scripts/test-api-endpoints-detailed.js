#!/usr/bin/env node

/**
 * DETAILED API ENDPOINT TESTING
 * Tests each API endpoint individually with detailed error reporting
 */

require('dotenv').config({ path: '.env.local' });

const baseUrl = 'http://localhost:3000';

async function testEndpoint(path, method = 'GET', body = null) {
  console.log(`\n🔍 Testing ${method} ${path}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${path}`, options);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log(`   ✅ Success: ${JSON.stringify(data).substring(0, 200)}...`);
        return { success: true, data };
      } catch (e) {
        const text = await response.text();
        console.log(`   ✅ Success (text): ${text.substring(0, 200)}...`);
        return { success: true, data: text };
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
      
      // Try to get more details from the error
      if (errorText.includes('Internal Server Error') && response.status === 500) {
        console.log(`   🔍 This is a 500 error - likely a server-side issue`);
      }
      
      return { success: false, error: errorText, status: response.status };
    }
    
  } catch (err) {
    console.log(`   ❌ Network Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function runDetailedAPITests() {
  console.log('🚀 STARTING DETAILED API ENDPOINT TESTS\n');
  
  const tests = [
    { path: '/api/admin/nominations', method: 'GET' },
    { path: '/api/nominations', method: 'GET' },
    { path: '/api/stats', method: 'GET' },
    { path: '/api/votes', method: 'GET' },
    { path: '/api/nominees', method: 'GET' },
    { path: '/api/nominees?subcategoryId=top-recruiter', method: 'GET' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.method, test.body);
    results.push({ ...test, ...result });
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DETAILED API TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n🚨 FAILED ENDPOINTS:');
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.method} ${result.path}`);
      console.log(`   Status: ${result.status || 'Network Error'}`);
      console.log(`   Error: ${result.error?.substring(0, 200)}...`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL ENDPOINTS:');
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.method} ${result.path}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

runDetailedAPITests().catch(console.error);