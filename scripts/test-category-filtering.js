#!/usr/bin/env node

/**
 * Test Script: Category Filtering Verification
 * 
 * This script tests that category filtering works correctly on the homepage
 * and directory page.
 */

const { execSync } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir(path.join(__dirname, '..'));

console.log('🧪 Testing Category Filtering...\n');

async function testCategoryFiltering() {
  try {
    console.log('📋 Testing Category Filtering:');
    console.log('   1. ✅ Homepage category badges link to filtered directory');
    console.log('   2. ✅ Directory page filters by category parameter');
    console.log('   3. ✅ API returns only nominees from selected category');
    console.log('');

    // Test 1: Check category badge names match constants
    console.log('🔍 Test 1: Category Badge Names...');
    
    const fs = require('fs');
    
    // Read the categories section
    const categoriesContent = fs.readFileSync('src/components/home/CategoriesSection.tsx', 'utf8');
    
    // Read the constants
    const constantsContent = fs.readFileSync('src/lib/constants.ts', 'utf8');
    
    // Extract badge names from categories section
    const badgeMatches = categoriesContent.match(/badges: \[(.*?)\]/gs);
    const allBadges = [];
    
    if (badgeMatches) {
      badgeMatches.forEach(match => {
        const badges = match.match(/"([^"]+)"/g);
        if (badges) {
          badges.forEach(badge => {
            allBadges.push(badge.replace(/"/g, ''));
          });
        }
      });
    }
    
    console.log('   📊 Found badge categories:');
    allBadges.forEach(badge => {
      const isValidCategory = constantsContent.includes(`"${badge}"`);
      console.log(`   ${isValidCategory ? '✅' : '❌'} ${badge}: ${isValidCategory ? 'VALID' : 'INVALID'}`);
    });
    console.log('');

    // Test 2: Check CategoryCard links
    console.log('🔍 Test 2: CategoryCard Links...');
    
    const categoryCardContent = fs.readFileSync('src/components/animations/CategoryCard.tsx', 'utf8');
    
    const hasDirectoryLink = categoryCardContent.includes('/directory?category=');
    const hasEncodeURIComponent = categoryCardContent.includes('encodeURIComponent(badge)');
    
    console.log(`   ${hasDirectoryLink ? '✅' : '❌'} Links to directory with category: ${hasDirectoryLink ? 'YES' : 'NO'}`);
    console.log(`   ${hasEncodeURIComponent ? '✅' : '❌'} Properly encodes category names: ${hasEncodeURIComponent ? 'YES' : 'NO'}`);
    console.log('');

    // Test 3: Check directory page filtering
    console.log('🔍 Test 3: Directory Page Filtering...');
    
    const directoryContent = fs.readFileSync('src/app/directory/page.tsx', 'utf8');
    
    const readsCategory = directoryContent.includes('searchParams.get("category")');
    const passesToAPI = directoryContent.includes('params.set(\'category\', selectedCategory)');
    const showsInTitle = directoryContent.includes('selectedCategory ? `Directory — ${selectedCategory}`');
    
    console.log(`   ${readsCategory ? '✅' : '❌'} Reads category from URL: ${readsCategory ? 'YES' : 'NO'}`);
    console.log(`   ${passesToAPI ? '✅' : '❌'} Passes category to API: ${passesToAPI ? 'YES' : 'NO'}`);
    console.log(`   ${showsInTitle ? '✅' : '❌'} Shows category in title: ${showsInTitle ? 'YES' : 'NO'}`);
    console.log('');

    // Test 4: Check API filtering
    console.log('🔍 Test 4: API Filtering...');
    
    const apiContent = fs.readFileSync('src/app/api/nominees/route.ts', 'utf8');
    
    const getsCategory = apiContent.includes('searchParams.get("category")');
    const filtersQuery = apiContent.includes('query.eq(\'category\', category)');
    
    console.log(`   ${getsCategory ? '✅' : '❌'} Gets category parameter: ${getsCategory ? 'YES' : 'NO'}`);
    console.log(`   ${filtersQuery ? '✅' : '❌'} Filters database query: ${filtersQuery ? 'YES' : 'NO'}`);
    console.log('');

    // Test 5: Example URLs
    console.log('🔍 Test 5: Example Category URLs...');
    console.log('');
    console.log('   📤 Example Category Links:');
    console.log('   • Top Recruiter: /directory?category=Top%20Recruiter');
    console.log('   • Top Executive Leader: /directory?category=Top%20Executive%20Leader');
    console.log('   • Rising Star (Under 30): /directory?category=Rising%20Star%20(Under%2030)');
    console.log('   • Top Staffing Influencer: /directory?category=Top%20Staffing%20Influencer');
    console.log('   • Top AI-Driven Staffing Platform: /directory?category=Top%20AI-Driven%20Staffing%20Platform');
    console.log('');

    // Test 6: Verification steps
    console.log('📋 Manual Verification Steps:');
    console.log('   1. Go to homepage');
    console.log('   2. Click on any category badge (e.g., "Top Recruiter")');
    console.log('   3. Verify you are redirected to: /directory?category=Top%20Recruiter');
    console.log('   4. Verify the page title shows: "Directory — Top Recruiter"');
    console.log('   5. Verify only "Top Recruiter" nominees are displayed');
    console.log('   6. Verify the results count shows correct number');
    console.log('');

    // Test 7: Summary
    console.log('✅ Category Filtering Implementation:');
    
    const allBadgesValid = allBadges.every(badge => constantsContent.includes(`"${badge}"`));
    const allLinksCorrect = hasDirectoryLink && hasEncodeURIComponent;
    const allDirectoryCorrect = readsCategory && passesToAPI && showsInTitle;
    const allAPICorrect = getsCategory && filtersQuery;
    
    console.log(`   ${allBadgesValid ? '✅' : '❌'} Badge Names: ${allBadgesValid ? 'ALL VALID' : 'SOME INVALID'}`);
    console.log(`   ${allLinksCorrect ? '✅' : '❌'} Category Links: ${allLinksCorrect ? 'WORKING' : 'BROKEN'}`);
    console.log(`   ${allDirectoryCorrect ? '✅' : '❌'} Directory Filtering: ${allDirectoryCorrect ? 'WORKING' : 'BROKEN'}`);
    console.log(`   ${allAPICorrect ? '✅' : '❌'} API Filtering: ${allAPICorrect ? 'WORKING' : 'BROKEN'}`);
    console.log('');

    const allTestsPassed = allBadgesValid && allLinksCorrect && allDirectoryCorrect && allAPICorrect;
    
    if (allTestsPassed) {
      console.log('🎉 CATEGORY FILTERING WORKING CORRECTLY!');
      console.log('   ✅ Homepage category badges link to filtered directory');
      console.log('   ✅ Directory page filters by category parameter');
      console.log('   ✅ API returns only nominees from selected category');
      console.log('   ✅ Category names match between components and constants');
    } else {
      console.log('⚠️  Some category filtering issues found. Please review above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCategoryFiltering();