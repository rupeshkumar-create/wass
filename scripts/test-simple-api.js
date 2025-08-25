#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function testSimpleAPI() {
  console.log('🔧 Testing Simple API');
  console.log('====================');
  
  try {
    const timestamp = Date.now();
    
    // Test the simple API
    console.log('\n1. Testing nominees-simple API...');
    const response = await fetch(`http://localhost:3000/api/nominees-simple?category=Top%20Recruiter&_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!response.ok) {
      console.log(`❌ API failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    console.log(`   Simple API returned: ${data.length} nominees`);
    
    // Verify all are Top Recruiter
    const nonTopRecruiters = data.filter(n => n.category !== 'Top Recruiter');
    if (nonTopRecruiters.length > 0) {
      console.log(`\n❌ Found ${nonTopRecruiters.length} non-Top Recruiter nominees!`);
      console.log(`   Sample: ${nonTopRecruiters[0].nominee?.name} (${nonTopRecruiters[0].category})`);
    } else {
      console.log(`\n✅ All ${data.length} nominees are Top Recruiter category`);
      if (data.length > 0) {
        console.log(`   Sample: ${data[0].nominee?.name} (${data[0].category})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleAPI();