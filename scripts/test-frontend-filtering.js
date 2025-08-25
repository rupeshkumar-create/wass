#!/usr/bin/env node

/**
 * Test Frontend Filtering
 * 
 * This script simulates the exact filtering logic used in the directory page
 * to verify it works correctly.
 */

const { execSync } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir(path.join(__dirname, '..'));

console.log('🧪 Testing Frontend Filtering Logic...\n');

async function testFrontendFiltering() {
  try {
    // Step 1: Get all nominees from API
    console.log('📋 Step 1: Fetching all nominees...');
    
    const response = await fetch('http://localhost:3000/api/nominees');
    const allNominees = await response.json();
    
    console.log(`   📊 Total nominees: ${allNominees.length}`);
    
    // Step 2: Simulate the exact filtering logic from directory page
    console.log('📋 Step 2: Simulating directory page filtering...');
    
    const selectedCategory = 'Top Recruiter';
    const selectedType = '';
    const searchQuery = '';
    
    console.log('🔍 Filters:', { selectedCategory, selectedType, searchQuery });
    
    let data = [...allNominees]; // Copy the array
    
    console.log('🔍 Before filtering:', data.length, 'nominees');
    
    // Apply category filter
    if (selectedCategory) {
      console.log('🔍 Applying category filter:', selectedCategory);
      data = data.filter((nominee) => nominee.category === selectedCategory);
      console.log('🔍 After category filter:', data.length);
    }
    
    // Apply type filter
    if (selectedType) {
      console.log('🔍 Applying type filter:', selectedType);
      data = data.filter((nominee) => nominee.type === selectedType);
      console.log('🔍 After type filter:', data.length);
    }
    
    // Apply search filter
    if (searchQuery) {
      console.log('🔍 Applying search filter:', searchQuery);
      data = data.filter((nominee) => 
        nominee.nominee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nominee.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 After search filter:', data.length);
    }
    
    console.log('🔍 Final filtered data:', data.length);
    
    // Step 3: Verify all results are correct category
    console.log('📋 Step 3: Verifying filtered results...');
    
    const correctCategory = data.filter(n => n.category === 'Top Recruiter').length;
    const wrongCategory = data.filter(n => n.category !== 'Top Recruiter').length;
    
    console.log(`   ✅ Correct "Top Recruiter": ${correctCategory}`);
    console.log(`   ❌ Wrong categories: ${wrongCategory}`);
    
    if (wrongCategory > 0) {
      console.log('   📋 Wrong categories:');
      const wrongCats = [...new Set(data.filter(n => n.category !== 'Top Recruiter').map(n => n.category))];
      wrongCats.forEach(cat => {
        const count = data.filter(n => n.category === cat).length;
        console.log(`      • "${cat}": ${count}`);
      });
    }
    
    // Step 4: Show sample results
    console.log('📋 Step 4: Sample filtered results...');
    
    data.slice(0, 5).forEach((nominee, index) => {
      console.log(`   ${index + 1}. ${nominee.nominee.name} - "${nominee.category}" (${nominee.votes} votes)`);
    });
    
    console.log('');
    
    // Summary
    console.log('🎯 Frontend Filtering Test Results:');
    console.log(`   • Input: ${allNominees.length} nominees`);
    console.log(`   • Filter: category = "${selectedCategory}"`);
    console.log(`   • Output: ${data.length} nominees`);
    console.log(`   • Expected: 18 nominees`);
    console.log(`   • Working: ${data.length === 18 && wrongCategory === 0 ? 'YES ✅' : 'NO ❌'}`);
    
    if (data.length === 18 && wrongCategory === 0) {
      console.log('');
      console.log('🎉 FRONTEND FILTERING LOGIC IS WORKING CORRECTLY!');
      console.log('   The issue must be in the React component state management');
      console.log('   or the way the filtering is being applied in the useEffect.');
    } else {
      console.log('');
      console.log('❌ FRONTEND FILTERING LOGIC HAS ISSUES');
      console.log('   The filtering logic itself is not working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFrontendFiltering();