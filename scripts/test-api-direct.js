#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function testAPIDirect() {
  console.log('🔍 Testing API Direct with Cache Busting');
  console.log('========================================');
  
  try {
    const timestamp = Date.now();
    
    // Test with cache busting
    console.log('\n1. Testing with cache busting...');
    const response = await fetch(`http://localhost:3000/api/nominees?category=Top%20Recruiter&_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    if (!response.ok) {
      console.log(`❌ API failed: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`   API returned: ${data.length} nominees`);
    
    // Check debug headers
    console.log('\n2. Debug headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.startsWith('x-debug')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    // Check if any nominees are actually Top Recruiter
    const topRecruiters = data.filter(n => n.category === 'Top Recruiter');
    console.log(`\n3. Actual Top Recruiter nominees in response: ${topRecruiters.length}`);
    
    if (topRecruiters.length > 0) {
      console.log(`   Sample: ${topRecruiters[0].nominee?.name} (${topRecruiters[0].category})`);
    }
    
    // Check if all nominees are Top Recruiter (as they should be)
    const nonTopRecruiters = data.filter(n => n.category !== 'Top Recruiter');
    if (nonTopRecruiters.length > 0) {
      console.log(`\n❌ Found ${nonTopRecruiters.length} non-Top Recruiter nominees in filtered response!`);
      console.log(`   Sample non-Top Recruiter: ${nonTopRecruiters[0].nominee?.name} (${nonTopRecruiters[0].category})`);
    } else {
      console.log(`\n✅ All returned nominees are Top Recruiter category`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIDirect();