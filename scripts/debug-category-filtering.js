#!/usr/bin/env node

/**
 * Debug Script: Category Filtering Issue
 * 
 * This script will test the actual API call to see what's happening
 * when we filter by "Top Recruiter"
 */

const { execSync } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir(path.join(__dirname, '..'));

console.log('🔍 Debugging Category Filtering Issue...\n');

async function debugCategoryFiltering() {
  try {
    console.log('📋 Testing API Call for "Top Recruiter" category...');
    
    // Test the API call directly
    const testUrl = 'http://localhost:3000/api/nominees?category=Top%20Recruiter';
    console.log(`🌐 Testing URL: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log(`📊 API Response Status: ${response.status}`);
      console.log(`📊 Number of results: ${data.length}`);
      console.log('');
      
      if (data.length > 0) {
        console.log('📋 Categories found in results:');
        const categories = [...new Set(data.map(nominee => nominee.category))];
        categories.forEach(category => {
          const count = data.filter(n => n.category === category).length;
          console.log(`   • ${category}: ${count} nominees`);
        });
        console.log('');
        
        console.log('📋 First 5 nominees:');
        data.slice(0, 5).forEach((nominee, index) => {
          console.log(`   ${index + 1}. ${nominee.nominee.name} - Category: "${nominee.category}"`);
        });
      } else {
        console.log('❌ No nominees found for "Top Recruiter" category');
      }
      
    } catch (fetchError) {
      console.log('❌ API call failed:', fetchError.message);
      console.log('   This might be because the server is not running');
      console.log('   Please start the server with: npm run dev');
    }
    
    console.log('');
    
    // Check the database view directly
    console.log('🔍 Checking database structure...');
    
    const fs = require('fs');
    
    // Check if we can see the Supabase schema
    if (fs.existsSync('supabase-schema.sql')) {
      const schemaContent = fs.readFileSync('supabase-schema.sql', 'utf8');
      
      if (schemaContent.includes('public_nominees')) {
        console.log('   ✅ public_nominees view exists in schema');
      } else {
        console.log('   ❌ public_nominees view not found in schema');
      }
      
      if (schemaContent.includes('category TEXT')) {
        console.log('   ✅ category column exists');
      } else {
        console.log('   ❌ category column not found');
      }
    }
    
    console.log('');
    
    // Check the API code
    console.log('🔍 Checking API filtering logic...');
    
    const apiContent = fs.readFileSync('src/app/api/nominees/route.ts', 'utf8');
    
    // Look for the filtering logic
    if (apiContent.includes('query.eq(\'category\', category)')) {
      console.log('   ✅ API has category filtering logic');
    } else {
      console.log('   ❌ API missing category filtering logic');
    }
    
    // Check if there are any case sensitivity issues
    if (apiContent.includes('.ilike.')) {
      console.log('   ⚠️  API uses case-insensitive search - this might cause issues');
    }
    
    console.log('');
    
    // Check the exact category names in constants
    console.log('🔍 Checking category constants...');
    
    const constantsContent = fs.readFileSync('src/lib/constants.ts', 'utf8');
    
    if (constantsContent.includes('"Top Recruiter"')) {
      console.log('   ✅ "Top Recruiter" found in constants');
    } else {
      console.log('   ❌ "Top Recruiter" not found in constants');
    }
    
    // Extract all categories from constants
    const categoryMatches = constantsContent.match(/"([^"]+)"/g);
    if (categoryMatches) {
      const categories = categoryMatches
        .map(match => match.replace(/"/g, ''))
        .filter(cat => cat.includes('Top') || cat.includes('Rising') || cat.includes('Best') || cat.includes('Fastest') || cat.includes('Special'));
      
      console.log('   📋 All categories in constants:');
      categories.forEach(category => {
        console.log(`      • ${category}`);
      });
    }
    
    console.log('');
    
    // Recommendations
    console.log('🎯 Debugging Recommendations:');
    console.log('   1. Check if the server is running (npm run dev)');
    console.log('   2. Test the API call directly in browser:');
    console.log('      http://localhost:3000/api/nominees?category=Top%20Recruiter');
    console.log('   3. Check the database to see what categories actually exist');
    console.log('   4. Verify the category names match exactly (case-sensitive)');
    console.log('   5. Check if there are any URL encoding issues');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugCategoryFiltering();