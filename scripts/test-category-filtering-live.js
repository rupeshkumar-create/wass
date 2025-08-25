#!/usr/bin/env node

/**
 * Live Test: Category Filtering Debug
 * 
 * This script will test the actual category filtering by making real API calls
 * and checking the results step by step.
 */

const { execSync } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir(path.join(__dirname, '..'));

console.log('🔍 Live Category Filtering Debug...\n');

async function testLiveFiltering() {
  try {
    console.log('📋 Step 1: Testing API without filters...');
    
    const response1 = await fetch('http://localhost:3000/api/nominees');
    const allNominees = await response1.json();
    
    console.log(`   📊 Total nominees: ${allNominees.length}`);
    
    // Count nominees by category
    const categoryCount = {};
    allNominees.forEach(nominee => {
      const cat = nominee.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    console.log('   📊 Categories found:');
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`      • "${cat}": ${count} nominees`);
    });
    
    const topRecruiterCount = categoryCount['Top Recruiter'] || 0;
    console.log(`   🎯 "Top Recruiter" nominees: ${topRecruiterCount}`);
    
    console.log('');
    
    // Step 2: Test API with category filter
    console.log('📋 Step 2: Testing API with category filter...');
    
    const response2 = await fetch('http://localhost:3000/api/nominees?category=Top%20Recruiter');
    const filteredNominees = await response2.json();
    
    console.log(`   📊 Filtered nominees: ${filteredNominees.length}`);
    
    // Check if all returned nominees are actually "Top Recruiter"
    const correctCategory = filteredNominees.filter(n => n.category === 'Top Recruiter').length;
    const wrongCategory = filteredNominees.filter(n => n.category !== 'Top Recruiter').length;
    
    console.log(`   ✅ Correct category: ${correctCategory}`);
    console.log(`   ❌ Wrong category: ${wrongCategory}`);
    
    if (wrongCategory > 0) {
      console.log('   📋 Wrong categories found:');
      const wrongCats = [...new Set(filteredNominees.filter(n => n.category !== 'Top Recruiter').map(n => n.category))];
      wrongCats.forEach(cat => {
        const count = filteredNominees.filter(n => n.category === cat).length;
        console.log(`      • "${cat}": ${count}`);
      });
    }
    
    console.log('');
    
    // Step 3: Test client-side filtering manually
    console.log('📋 Step 3: Testing client-side filtering manually...');
    
    const manuallyFiltered = allNominees.filter(nominee => nominee.category === 'Top Recruiter');
    console.log(`   📊 Manually filtered: ${manuallyFiltered.length}`);
    
    console.log('');
    
    // Step 4: Test the directory page
    console.log('📋 Step 4: Testing directory page...');
    
    try {
      const response3 = await fetch('http://localhost:3000/directory?category=Top%20Recruiter');
      const directoryHtml = await response3.text();
      
      // Count occurrences of "Top Recruiter" in the HTML
      const topRecruiterMatches = (directoryHtml.match(/Top Recruiter/g) || []).length;
      console.log(`   📊 "Top Recruiter" mentions in HTML: ${topRecruiterMatches}`);
      
      // Check if the page title shows the category
      const hasFilteredTitle = directoryHtml.includes('Directory — Top Recruiter');
      console.log(`   📊 Has filtered title: ${hasFilteredTitle ? 'YES' : 'NO'}`);
      
      // Check if results count is shown
      const showingMatch = directoryHtml.match(/Showing (\d+) nominees/);
      if (showingMatch) {
        console.log(`   📊 Showing count: ${showingMatch[1]} nominees`);
      }
      
    } catch (error) {
      console.log(`   ❌ Directory page test failed: ${error.message}`);
    }
    
    console.log('');
    
    // Summary
    console.log('🎯 Summary:');
    console.log(`   • Total nominees in DB: ${allNominees.length}`);
    console.log(`   • "Top Recruiter" nominees in DB: ${topRecruiterCount}`);
    console.log(`   • API with filter returns: ${filteredNominees.length} (should be ${topRecruiterCount})`);
    console.log(`   • Manual client-side filter: ${manuallyFiltered.length}`);
    console.log(`   • API filtering working: ${filteredNominees.length === topRecruiterCount ? 'YES' : 'NO'}`);
    
    if (filteredNominees.length !== topRecruiterCount) {
      console.log('');
      console.log('❌ ISSUE IDENTIFIED:');
      console.log('   The API is not filtering correctly. This is likely due to:');
      console.log('   1. Next.js caching issues (x-nextjs-cache: HIT)');
      console.log('   2. The dynamic = "force-dynamic" setting not taking effect');
      console.log('   3. Server-side filtering logic not working');
      console.log('');
      console.log('🔧 RECOMMENDED SOLUTION:');
      console.log('   Since the directory page has client-side filtering implemented,');
      console.log('   the filtering should work on the frontend even if the API is cached.');
      console.log('   The issue might be in the frontend filtering logic.');
    } else {
      console.log('');
      console.log('✅ API filtering is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLiveFiltering();