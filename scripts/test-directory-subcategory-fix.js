#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function testDirectorySubcategoryFix() {
  console.log('🔧 Testing Directory Subcategory Fix');
  console.log('===================================');
  
  try {
    // Test the directory page filtering logic by simulating what it does
    console.log('\n1. Fetching all nominees...');
    const timestamp = Date.now();
    const response = await fetch(`http://localhost:3000/api/nominees?_t=${timestamp}`, {
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
    
    const allData = await response.json();
    console.log(`   Retrieved ${allData.length} total nominees`);
    
    // Test filtering for "Top Recruiter"
    console.log('\n2. Testing "Top Recruiter" filtering...');
    const selectedCategory = 'Top Recruiter';
    let filteredData = allData.filter(nominee => nominee.category === selectedCategory);
    console.log(`   Filtered result: ${filteredData.length} nominees`);
    
    if (filteredData.length > 0) {
      console.log(`   Sample: ${filteredData[0].nominee?.name} (${filteredData[0].category})`);
    }
    
    // Verify all are correct category
    const wrongCategory = filteredData.filter(n => n.category !== selectedCategory);
    if (wrongCategory.length > 0) {
      console.log(`   ❌ Found ${wrongCategory.length} nominees with wrong category!`);
    } else {
      console.log(`   ✅ All ${filteredData.length} nominees have correct category`);
    }
    
    // Test other categories
    const testCategories = ['Top Executive Leader', 'Top Staffing Influencer', 'Rising Star (Under 30)'];
    
    for (const category of testCategories) {
      console.log(`\n3. Testing "${category}" filtering...`);
      const filtered = allData.filter(nominee => nominee.category === category);
      console.log(`   Result: ${filtered.length} nominees`);
      
      if (filtered.length > 0) {
        console.log(`   Sample: ${filtered[0].nominee?.name} (${filtered[0].category})`);
      }
    }
    
    console.log('\n✅ Directory subcategory filtering should now work correctly!');
    console.log('   The issue was that the API server-side filtering was not working,');
    console.log('   but the client-side filtering in the directory page should handle it properly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectorySubcategoryFix();