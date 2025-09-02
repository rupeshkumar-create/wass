#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function debugAPIFiltering() {
  console.log('🔍 Debugging API Filtering Logic');
  console.log('===============================');
  
  try {
    // Test without any filters first
    console.log('\n1. Testing API without filters...');
    const allResponse = await fetch('http://localhost:3000/api/nominees', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    const allData = await allResponse.json();
    console.log(`   Total nominees: ${allData.length}`);
    
    // Check response headers for debug info
    console.log('\n2. Response headers:');
    for (const [key, value] of allResponse.headers.entries()) {
      if (key.startsWith('x-debug')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    // Test with Top Recruiter filter
    console.log('\n3. Testing API with Top Recruiter filter...');
    const filterResponse = await fetch('http://localhost:3000/api/nominees?category=Top%20Recruiter', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    const filterData = await filterResponse.json();
    console.log(`   Filtered nominees: ${filterData.length}`);
    
    // Check response headers for debug info
    console.log('\n4. Filtered response headers:');
    for (const [key, value] of filterResponse.headers.entries()) {
      if (key.startsWith('x-debug')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    // Manual filtering test
    console.log('\n5. Manual filtering test:');
    const manualFiltered = allData.filter(n => n.category === 'Top Recruiter');
    console.log(`   Manual filter result: ${manualFiltered.length} nominees`);
    
    if (manualFiltered.length > 0) {
      console.log(`   Sample filtered nominee: ${manualFiltered[0].nominee?.name} (${manualFiltered[0].category})`);
    }
    
    // Check if API is actually applying the filter
    if (filterData.length === allData.length) {
      console.log('\n❌ API FILTERING IS NOT WORKING - returning all data regardless of filter');
    } else if (filterData.length === manualFiltered.length) {
      console.log('\n✅ API filtering is working correctly');
    } else {
      console.log('\n⚠️  API filtering is partially working but results don\'t match expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAPIFiltering();