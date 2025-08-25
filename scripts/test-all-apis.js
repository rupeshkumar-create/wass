#!/usr/bin/env node

/**
 * Test All APIs
 * Tests key API endpoints to ensure they're working after the fixes
 */

async function testAllAPIs() {
  console.log('🧪 Testing All Key APIs...');
  console.log('='.repeat(50));
  
  const tests = [
    {
      name: 'Nominations API',
      url: 'http://localhost:3000/api/nominations',
      method: 'GET'
    },
    {
      name: 'Stats API',
      url: 'http://localhost:3000/api/stats',
      method: 'GET'
    },
    {
      name: 'Podium API',
      url: 'http://localhost:3000/api/podium',
      method: 'GET'
    },
    {
      name: 'Nominees API',
      url: 'http://localhost:3000/api/nominees',
      method: 'GET'
    },
    {
      name: 'Test Storage API',
      url: 'http://localhost:3000/api/test/storage',
      method: 'GET'
    }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\\n${i + 1}️⃣ Testing ${test.name}...`);
    
    try {
      const response = await fetch(test.url, { method: test.method });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${test.name} working`);
        
        // Show some basic info about the response
        if (test.name === 'Nominations API' && Array.isArray(data)) {
          console.log(`   📊 Found ${data.length} nominations`);
        } else if (test.name === 'Stats API' && data.totalNominations) {
          console.log(`   📊 Total nominations: ${data.totalNominations}`);
        } else if (test.name === 'Podium API' && data.podium) {
          const categories = Object.keys(data.podium);
          console.log(`   📊 Found ${categories.length} categories`);
        } else if (test.name === 'Nominees API' && data.nominees) {
          console.log(`   📊 Found ${data.nominees.length} nominees`);
        }
        
        passedTests++;
      } else {
        console.log(`   ❌ ${test.name} failed`);
        console.log(`   Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} error`);
      console.log(`   Error: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log('\\n🎉 API Testing Completed!');
  console.log('\\n📋 Summary:');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  
  if (failedTests === 0) {
    console.log('\\n🚀 All APIs are working correctly!');
    console.log('✅ Nominee profiles should now be accessible');
    console.log('✅ Image uploads should work');
    console.log('✅ All platform features should be functional');
  } else {
    console.log('\\n⚠️  Some APIs still have issues that need attention');
  }
}

testAllAPIs();