#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function testFixedAPI() {
  console.log('🔧 Testing Fixed API');
  console.log('===================');
  
  try {
    const timestamp = Date.now();
    
    // Test the fixed API
    console.log('\n1. Testing nominees-fixed API...');
    const response = await fetch(`http://localhost:3000/api/nominees-fixed?category=Top%20Recruiter&_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!response.ok) {
      console.log(`❌ API failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }
    
    const data = await response.json();
    console.log(`   Fixed API returned: ${data.length} nominees`);
    
    // Check debug headers
    console.log('\n2. Debug headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.startsWith('x-debug')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    // Verify all are Top Recruiter
    const nonTopRecruiters = data.filter(n => n.category !== 'Top Recruiter');
    if (nonTopRecruiters.length > 0) {
      console.log(`\n❌ Found ${nonTopRecruiters.length} non-Top Recruiter nominees!`);
    } else {
      console.log(`\n✅ All ${data.length} nominees are Top Recruiter category`);
    }
    
    if (data.length > 0) {
      console.log(`   Sample: ${data[0].nominee?.name} (${data[0].category})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixedAPI();