#!/usr/bin/env node

// Use node-fetch for Node.js compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testSpecificNominee() {
  console.log('🔍 TESTING SPECIFIC NOMINEE PAGE ISSUE\n');

  try {
    // 1. Get a nominee from API
    console.log('1. Getting nominee from API...');
    const apiResponse = await fetch(`${BASE_URL}/api/nominees?limit=1`);
    const apiData = await apiResponse.json();
    
    if (!apiData.success || !apiData.data || apiData.data.length === 0) {
      console.log('❌ No nominees found in API');
      return;
    }
    
    const nominee = apiData.data[0];
    console.log(`✅ Found nominee: ${nominee.nominee?.displayName}`);
    console.log(`   ID: ${nominee.id}`);
    console.log(`   Nominee ID: ${nominee.nomineeId}`);
    
    // 2. Test the individual page
    console.log('\n2. Testing individual page...');
    const pageUrl = `/nominee/${nominee.id}`;
    console.log(`   URL: ${pageUrl}`);
    
    const pageResponse = await fetch(`${BASE_URL}${pageUrl}`);
    console.log(`   Status: ${pageResponse.status}`);
    
    if (pageResponse.ok) {
      const content = await pageResponse.text();
      
      // Check for 404 content
      const has404Title = content.includes('404: This page could not be found');
      const has404Text = content.includes('This page could not be found');
      const hasNomineeName = content.includes(nominee.nominee?.displayName);
      
      console.log(`   Contains nominee name: ${hasNomineeName}`);
      console.log(`   Contains 404 title: ${has404Title}`);
      console.log(`   Contains 404 text: ${has404Text}`);
      
      if (hasNomineeName && !has404Title && !has404Text) {
        console.log('   ✅ Page working correctly!');
      } else if (hasNomineeName && (has404Title || has404Text)) {
        console.log('   ⚠️  Page has content but also shows 404 error');
        console.log('   This suggests the page component is working but Next.js is also rendering a 404');
      } else {
        console.log('   ❌ Page not working correctly');
      }
      
      // Check if it's a Next.js routing issue
      if (content.includes('__next_f')) {
        console.log('   📋 This is a Next.js hydrated page');
      }
      
    } else {
      console.log(`   ❌ Page failed with status: ${pageResponse.status}`);
    }
    
    // 3. Test with different nominee IDs
    console.log('\n3. Testing with different IDs...');
    
    const testIds = [
      nominee.id,
      nominee.nomineeId,
      'invalid-id'
    ];
    
    for (const testId of testIds) {
      try {
        const testResponse = await fetch(`${BASE_URL}/nominee/${testId}`);
        console.log(`   ${testId}: ${testResponse.status}`);
        
        if (testResponse.ok) {
          const testContent = await testResponse.text();
          const hasName = testContent.includes(nominee.nominee?.displayName);
          const has404 = testContent.includes('404: This page could not be found');
          console.log(`     Has name: ${hasName}, Has 404: ${has404}`);
        }
      } catch (error) {
        console.log(`   ${testId}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSpecificNominee();