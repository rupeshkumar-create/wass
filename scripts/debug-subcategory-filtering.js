#!/usr/bin/env node

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch;

async function debugSubcategoryFiltering() {
  console.log('🔍 Debugging Subcategory Filtering Issue');
  console.log('=====================================');
  
  try {
    // Test the API directly
    console.log('\n1. Testing API directly...');
    const response = await fetch('http://localhost:3000/api/nominees', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API returned ${data.length} total nominees`);
    
    // Check data structure
    if (data.length > 0) {
      console.log('\n2. Sample nominee structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check categories
      console.log('\n3. Available categories:');
      const categories = [...new Set(data.map(n => n.category))];
      categories.forEach(cat => {
        const count = data.filter(n => n.category === cat).length;
        console.log(`   - ${cat}: ${count} nominees`);
      });
      
      // Test specific category filtering
      console.log('\n4. Testing "Top Recruiter" filtering:');
      const topRecruiters = data.filter(n => n.category === 'Top Recruiter');
      console.log(`   Found ${topRecruiters.length} Top Recruiter nominees`);
      
      if (topRecruiters.length > 0) {
        console.log('   Sample Top Recruiter:');
        console.log(`   - Name: ${topRecruiters[0].nominee?.name || 'N/A'}`);
        console.log(`   - Category: ${topRecruiters[0].category}`);
      }
      
      // Test API with category parameter
      console.log('\n5. Testing API with category parameter...');
      const categoryResponse = await fetch('http://localhost:3000/api/nominees?category=Top%20Recruiter', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        console.log(`✅ API with category filter returned ${categoryData.length} nominees`);
      } else {
        console.log(`❌ API with category filter failed: ${categoryResponse.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSubcategoryFiltering();