#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function testDirectoryFiltering() {
  console.log('🔍 Testing Directory Filtering Logic');
  console.log('===================================');
  
  try {
    // Test the API with different category filters
    const categories = ['Top Recruiter', 'Top Executive Leader', 'Top Staffing Influencer'];
    
    for (const category of categories) {
      console.log(`\n📋 Testing category: "${category}"`);
      
      // Test API call
      const encodedCategory = encodeURIComponent(category);
      const response = await fetch(`http://localhost:3000/api/nominees?category=${encodedCategory}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        console.log(`❌ API failed: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`   API returned: ${data.length} nominees`);
      
      // Check if filtering actually worked
      const correctlyFiltered = data.filter(n => n.category === category);
      console.log(`   Correctly filtered: ${correctlyFiltered.length} nominees`);
      
      if (data.length !== correctlyFiltered.length) {
        console.log(`   ❌ Server-side filtering failed! Expected ${correctlyFiltered.length}, got ${data.length}`);
      } else {
        console.log(`   ✅ Server-side filtering working correctly`);
      }
    }
    
    // Test the directory page URL structure
    console.log('\n🌐 Testing directory page URL structure:');
    console.log('   Expected URL: /directory?category=Top%20Recruiter');
    console.log('   This should filter to show only Top Recruiter nominees');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectoryFiltering();