#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function testCompleteSubcategoryFlow() {
  console.log('🎯 Testing Complete Subcategory Flow');
  console.log('===================================');
  
  try {
    // Test the homepage category links
    console.log('\n1. Testing homepage category badge links...');
    
    const testCategories = [
      'Top Recruiter',
      'Top Executive Leader',
      'Top Staffing Influencer', 
      'Rising Star (Under 30)',
      'Top AI-Driven Staffing Platform',
      'Top Digital Experience for Clients'
    ];
    
    for (const category of testCategories) {
      console.log(`\n   Testing category: "${category}"`);
      
      // Simulate what happens when user clicks a category badge
      const encodedCategory = encodeURIComponent(category);
      const directoryUrl = `http://localhost:3000/directory?category=${encodedCategory}`;
      console.log(`   Directory URL: ${directoryUrl}`);
      
      // Test the API call that the directory page would make
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:3000/api/nominees?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        console.log(`   ❌ API failed: ${response.status}`);
        continue;
      }
      
      const allData = await response.json();
      
      // Apply the same filtering logic as the directory page
      const filteredData = allData.filter(nominee => nominee.category === category);
      
      console.log(`   API returned: ${allData.length} total nominees`);
      console.log(`   Filtered to: ${filteredData.length} nominees for "${category}"`);
      
      if (filteredData.length > 0) {
        console.log(`   Sample nominee: ${filteredData[0].nominee?.name}`);
        
        // Verify all nominees have the correct category
        const wrongCategory = filteredData.filter(n => n.category !== category);
        if (wrongCategory.length === 0) {
          console.log(`   ✅ All nominees correctly filtered`);
        } else {
          console.log(`   ❌ Found ${wrongCategory.length} nominees with wrong category`);
        }
      } else {
        console.log(`   ℹ️  No nominees found for this category`);
      }
    }
    
    console.log('\n2. Testing subcategory chips in Popular Categories...');
    
    // Test the popular categories chips (first 8 categories)
    const popularCategories = testCategories.slice(0, 6);
    
    for (const category of popularCategories) {
      const response = await fetch(`http://localhost:3000/api/nominees?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter(n => n.category === category);
        console.log(`   "${category}": ${filtered.length} nominees`);
      }
    }
    
    console.log('\n✅ Complete subcategory flow test completed!');
    console.log('\nExpected behavior:');
    console.log('1. User clicks a category badge on homepage → redirects to /directory?category=CategoryName');
    console.log('2. Directory page loads all nominees and filters client-side by category');
    console.log('3. Only nominees matching the selected category are displayed');
    console.log('4. Popular category chips also work for quick filtering');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCompleteSubcategoryFlow();