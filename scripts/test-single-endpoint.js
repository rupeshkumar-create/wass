#!/usr/bin/env node

/**
 * TEST SINGLE ENDPOINT WITH DETAILED LOGGING
 */

async function testSingleEndpoint() {
  console.log('🔍 Testing single endpoint with detailed logging...\n');
  
  try {
    console.log('Making request to /api/admin/nominations...');
    
    const response = await fetch('http://localhost:3000/api/admin/nominations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    // Wait a bit to see server logs
    console.log('\nWaiting for server logs...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSingleEndpoint();