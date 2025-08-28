#!/usr/bin/env node

// Use node-fetch for Node.js compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function debugDirectoryLinks() {
  console.log('🔍 DEBUGGING DIRECTORY LINKS AND INDIVIDUAL PAGES\n');

  try {
    // 1. Check the main directory page
    console.log('1. Testing main directory page...');
    const directoryResponse = await fetch(`${BASE_URL}/directory`);
    console.log(`   Directory page status: ${directoryResponse.status}`);
    
    if (directoryResponse.ok) {
      const directoryContent = await directoryResponse.text();
      console.log('   ✅ Directory page loads');
      
      // Check if it contains nominee links
      const linkMatches = directoryContent.match(/\/nominee\/[a-f0-9-]+/g);
      if (linkMatches) {
        console.log(`   📋 Found ${linkMatches.length} nominee links in directory`);
        console.log(`   Sample links: ${linkMatches.slice(0, 3).join(', ')}`);
      } else {
        console.log('   ⚠️  No nominee links found in directory HTML');
      }
    } else {
      console.log('   ❌ Directory page failed to load');
    }

    // 2. Test the nominees API
    console.log('\n2. Testing nominees API...');
    const apiResponse = await fetch(`${BASE_URL}/api/nominees`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log(`   ✅ API working: ${apiData.count} nominees`);
      
      if (apiData.data && apiData.data.length > 0) {
        const firstNominee = apiData.data[0];
        console.log(`   📋 First nominee structure:`);
        console.log(`      ID: ${firstNominee.id}`);
        console.log(`      Name: ${firstNominee.nominee?.displayName || firstNominee.displayName}`);
        console.log(`      Type: ${firstNominee.type}`);
        console.log(`      Category: ${firstNominee.category}`);
        
        // 3. Test individual page for first nominee
        console.log('\n3. Testing individual page...');
        const individualUrl = `/nominee/${firstNominee.id}`;
        console.log(`   Testing URL: ${individualUrl}`);
        
        const pageResponse = await fetch(`${BASE_URL}${individualUrl}`);
        console.log(`   Individual page status: ${pageResponse.status}`);
        
        if (pageResponse.ok) {
          const pageContent = await pageResponse.text();
          console.log('   ✅ Individual page loads successfully');
          
          // Check if it contains the nominee's name
          const nomineeName = firstNominee.nominee?.displayName || firstNominee.displayName;
          if (pageContent.includes(nomineeName)) {
            console.log(`   ✅ Page contains nominee name: ${nomineeName}`);
          } else {
            console.log(`   ❌ Page does NOT contain nominee name: ${nomineeName}`);
          }
          
          // Check for error indicators
          if (pageContent.includes('404') || pageContent.includes('not found')) {
            console.log('   ❌ Page contains 404 error content');
          } else {
            console.log('   ✅ No 404 error content detected');
          }
          
        } else if (pageResponse.status === 404) {
          console.log('   ❌ Individual page returns 404 - THIS IS THE PROBLEM!');
        } else {
          console.log(`   ❌ Individual page failed with status: ${pageResponse.status}`);
        }
        
        // 4. Test multiple individual pages
        console.log('\n4. Testing multiple individual pages...');
        
        const testNominees = apiData.data.slice(0, 5);
        for (let i = 0; i < testNominees.length; i++) {
          const nominee = testNominees[i];
          const testUrl = `/nominee/${nominee.id}`;
          
          try {
            const testResponse = await fetch(`${BASE_URL}${testUrl}`);
            const status = testResponse.ok ? '✅' : '❌';
            const name = nominee.nominee?.displayName || nominee.displayName || 'Unknown';
            console.log(`   ${status} ${name}: ${testUrl} (${testResponse.status})`);
          } catch (error) {
            console.log(`   ❌ ${nominee.nominee?.displayName}: Error - ${error.message}`);
          }
        }
        
      } else {
        console.log('   ❌ No nominees in API response');
      }
    } else {
      console.log('   ❌ API failed');
    }

    // 5. Check the individual nominee page component
    console.log('\n5. Checking individual nominee page component...');
    
    // Test if the route exists by checking a known working URL pattern
    const testRoutes = [
      '/nominee/test-id',
      '/api/nominees'
    ];
    
    for (const route of testRoutes) {
      try {
        const routeResponse = await fetch(`${BASE_URL}${route}`);
        console.log(`   Route ${route}: ${routeResponse.status}`);
      } catch (error) {
        console.log(`   Route ${route}: Error - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n🔍 LIKELY ISSUES:');
    console.log('1. Individual nominee page component not handling new schema data');
    console.log('2. Route parameter mismatch between directory links and page component');
    console.log('3. Component expecting old data structure but receiving new schema');
    console.log('4. Missing error handling in the individual page component');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check the individual nominee page component code');
    console.log('2. Verify it handles the new schema data structure');
    console.log('3. Ensure proper error handling for missing nominees');
    console.log('4. Test the component with actual nominee data');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugDirectoryLinks();