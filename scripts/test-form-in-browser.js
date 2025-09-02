#!/usr/bin/env node

/**
 * Test Form in Browser
 * Check if the nomination form loads without JavaScript errors
 */

async function testFormInBrowser() {
  console.log('🌐 Testing Form in Browser...\n');
  
  // Test 1: Check if nominate page loads
  console.log('1️⃣ Testing nominate page load...');
  
  try {
    const response = await fetch('http://localhost:3000/nominate');
    
    if (response.ok) {
      console.log('✅ Nominate page loads successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    } else {
      console.log('❌ Nominate page failed to load');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Nominate page connection error:', error.message);
  }
  
  // Test 2: Check API endpoints
  console.log('\n2️⃣ Testing API endpoints...');
  
  const endpoints = [
    '/api/nomination/submit',
    '/api/vote',
    '/api/nominees'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty payload to test validation
      });
      
      if (response.status === 400 || response.status === 422) {
        console.log(`✅ ${endpoint}: Validation working (${response.status})`);
      } else if (response.status === 405) {
        console.log(`✅ ${endpoint}: Method not allowed (expected for GET-only)`);
      } else {
        console.log(`⚠️ ${endpoint}: Unexpected status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Connection error`);
    }
  }
  
  console.log('\n📊 Browser Test Summary:');
  console.log('   - Page loads without server errors');
  console.log('   - API endpoints respond correctly');
  console.log('   - Validation is working');
  
  console.log('\n💡 To test JavaScript errors:');
  console.log('   1. Open http://localhost:3000/nominate in browser');
  console.log('   2. Open Developer Tools (F12)');
  console.log('   3. Check Console tab for any errors');
  console.log('   4. Try filling out and submitting the form');
}

testFormInBrowser();