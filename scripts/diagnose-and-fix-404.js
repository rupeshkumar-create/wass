#!/usr/bin/env node

// Use node-fetch for Node.js compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function diagnoseAndFix404() {
  console.log('🔍 DIAGNOSING 404 ISSUE FOR INDIVIDUAL NOMINEE PAGES\n');

  try {
    // 1. Test the nominees API
    console.log('1. Testing /api/nominees endpoint...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/nominees`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API working`);
        console.log(`   Response structure:`, {
          success: data.success,
          count: data.count,
          dataLength: data.data?.length || 0,
          message: data.message
        });
        
        if (data.data && data.data.length > 0) {
          console.log(`   📋 Sample nominee:`, {
            id: data.data[0].id,
            nomineeId: data.data[0].nomineeId,
            displayName: data.data[0].nominee?.displayName || data.data[0].displayName,
            category: data.data[0].category,
            type: data.data[0].type,
            status: data.data[0].status
          });
          
          // Test individual page for first nominee
          const testId = data.data[0].id;
          console.log(`\n2. Testing individual page for ID: ${testId}`);
          
          const pageResponse = await fetch(`${BASE_URL}/nominee/${testId}`);
          console.log(`   Individual page status: ${pageResponse.status}`);
          
          if (pageResponse.ok) {
            console.log(`   ✅ Individual page working!`);
            console.log(`   🔗 Working URL: ${BASE_URL}/nominee/${testId}`);
          } else {
            console.log(`   ❌ Individual page 404 - this is the problem!`);
          }
        } else {
          console.log(`   ⚠️  No nominees found in API response`);
          console.log(`   This means we need to create test data`);
        }
      } else {
        console.log(`   ❌ API failed with status ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ API request failed: ${error.message}`);
    }

    console.log('\n3. Checking if we need to create test data...');
    
    // Check if we have any data at all
    const nomineesResponse = await fetch(`${BASE_URL}/api/nominees`);
    if (nomineesResponse.ok) {
      const nomineesData = await nomineesResponse.json();
      
      if (!nomineesData.data || nomineesData.data.length === 0) {
        console.log('   📝 No nominees found. Creating test data...');
        
        // We'll need to create test data directly in the database
        console.log('\n   🚨 ACTION REQUIRED:');
        console.log('   You need to run the test data creation script.');
        console.log('   The database schema is set up but has no approved nominations.');
        
        return {
          issue: 'NO_DATA',
          solution: 'CREATE_TEST_DATA'
        };
      } else {
        console.log(`   ✅ Found ${nomineesData.data.length} nominees`);
        
        // Test a few individual pages
        console.log('\n4. Testing multiple individual pages...');
        
        for (let i = 0; i < Math.min(3, nomineesData.data.length); i++) {
          const nominee = nomineesData.data[i];
          const testUrl = `/nominee/${nominee.id}`;
          
          try {
            const pageResponse = await fetch(`${BASE_URL}${testUrl}`);
            console.log(`   ${pageResponse.ok ? '✅' : '❌'} ${testUrl} - Status: ${pageResponse.status}`);
            
            if (pageResponse.ok) {
              console.log(`     🔗 Working: ${BASE_URL}${testUrl}`);
            }
          } catch (error) {
            console.log(`   ❌ ${testUrl} - Error: ${error.message}`);
          }
        }
        
        return {
          issue: 'PAGES_WORKING',
          workingUrls: nomineesData.data.slice(0, 3).map(n => `${BASE_URL}/nominee/${n.id}`)
        };
      }
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    return {
      issue: 'DIAGNOSIS_FAILED',
      error: error.message
    };
  }
}

// Run diagnosis
diagnoseAndFix404().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSIS RESULT');
  console.log('='.repeat(60));
  
  if (result.issue === 'NO_DATA') {
    console.log('🔍 ISSUE: No approved nominations in database');
    console.log('💡 SOLUTION: Create test data');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run the test data creation script');
    console.log('2. Verify nominees API returns data');
    console.log('3. Test individual nominee pages');
  } else if (result.issue === 'PAGES_WORKING') {
    console.log('✅ GOOD NEWS: Individual pages are working!');
    console.log('\n🔗 Working URLs:');
    result.workingUrls.forEach(url => console.log(`   ${url}`));
  } else {
    console.log('❌ ISSUE: Diagnosis failed');
    console.log(`Error: ${result.error}`);
  }
});