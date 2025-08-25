#!/usr/bin/env node

/**
 * Debug Script: Supabase Query Issue
 * 
 * This script will test the exact Supabase query to see why filtering isn't working
 */

const { execSync } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir(path.join(__dirname, '..'));

console.log('🔍 Debugging Supabase Query Issue...\n');

async function debugSupabaseQuery() {
  try {
    console.log('📋 Testing different API scenarios...');
    
    // Test 1: No filters (should return all)
    console.log('🧪 Test 1: No filters');
    try {
      const response1 = await fetch('http://localhost:3000/api/nominees');
      const data1 = await response1.json();
      console.log(`   📊 Total nominees: ${data1.length}`);
      
      // Show unique categories
      const categories = [...new Set(data1.map(n => n.category))];
      console.log(`   📊 Unique categories: ${categories.length}`);
      categories.forEach(cat => {
        const count = data1.filter(n => n.category === cat).length;
        console.log(`      • "${cat}": ${count}`);
      });
    } catch (error) {
      console.log('   ❌ Failed:', error.message);
    }
    
    console.log('');
    
    // Test 2: With category filter
    console.log('🧪 Test 2: With category filter "Top Recruiter"');
    try {
      const response2 = await fetch('http://localhost:3000/api/nominees?category=Top%20Recruiter');
      const data2 = await response2.json();
      console.log(`   📊 Filtered results: ${data2.length}`);
      
      // Check if all results are actually "Top Recruiter"
      const topRecruiters = data2.filter(n => n.category === 'Top Recruiter');
      const others = data2.filter(n => n.category !== 'Top Recruiter');
      
      console.log(`   ✅ Correct "Top Recruiter": ${topRecruiters.length}`);
      console.log(`   ❌ Wrong categories: ${others.length}`);
      
      if (others.length > 0) {
        console.log('   📋 Wrong categories found:');
        const wrongCategories = [...new Set(others.map(n => n.category))];
        wrongCategories.forEach(cat => {
          const count = others.filter(n => n.category === cat).length;
          console.log(`      • "${cat}": ${count}`);
        });
      }
    } catch (error) {
      console.log('   ❌ Failed:', error.message);
    }
    
    console.log('');
    
    // Test 3: Check URL encoding
    console.log('🧪 Test 3: Testing different URL encodings');
    
    const testCases = [
      'Top Recruiter',
      'Top%20Recruiter',
      encodeURIComponent('Top Recruiter'),
    ];
    
    for (const testCase of testCases) {
      try {
        const response = await fetch(`http://localhost:3000/api/nominees?category=${testCase}`);
        const data = await response.json();
        const correctCount = data.filter(n => n.category === 'Top Recruiter').length;
        console.log(`   "${testCase}": ${data.length} total, ${correctCount} correct`);
      } catch (error) {
        console.log(`   "${testCase}": Failed - ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 4: Check if it's a case sensitivity issue
    console.log('🧪 Test 4: Testing case sensitivity');
    
    const caseCases = [
      'Top Recruiter',
      'top recruiter',
      'TOP RECRUITER',
      'Top recruiter',
    ];
    
    for (const testCase of caseCases) {
      try {
        const response = await fetch(`http://localhost:3000/api/nominees?category=${encodeURIComponent(testCase)}`);
        const data = await response.json();
        const correctCount = data.filter(n => n.category === 'Top Recruiter').length;
        console.log(`   "${testCase}": ${data.length} total, ${correctCount} correct`);
      } catch (error) {
        console.log(`   "${testCase}": Failed - ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 5: Check the actual API code path
    console.log('🔍 Analyzing API code...');
    
    const fs = require('fs');
    const apiContent = fs.readFileSync('src/app/api/nominees/route.ts', 'utf8');
    
    // Look for potential issues
    if (apiContent.includes('query = query.eq(\'category\', category)')) {
      console.log('   ✅ Category filter code exists');
    } else {
      console.log('   ❌ Category filter code missing or different');
    }
    
    // Check if there are any other filters that might interfere
    if (apiContent.includes('query.or(')) {
      console.log('   ⚠️  OR query found - this might interfere with filtering');
      
      // Extract the OR query
      const orMatch = apiContent.match(/query\.or\([^)]+\)/);
      if (orMatch) {
        console.log(`   📋 OR query: ${orMatch[0]}`);
      }
    }
    
    console.log('');
    
    // Recommendations
    console.log('🎯 Issue Analysis:');
    console.log('   The API is returning ALL nominees instead of filtered ones.');
    console.log('   This suggests the Supabase query.eq() is not working properly.');
    console.log('');
    console.log('🔧 Possible Solutions:');
    console.log('   1. Check if the category column in database has exact matches');
    console.log('   2. Add debug logging to the API to see what category value is received');
    console.log('   3. Check if there are any query conflicts (OR vs AND)');
    console.log('   4. Verify the public_nominees view has correct data');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugSupabaseQuery();