#!/usr/bin/env node

/**
 * Test script to verify simplified directory cards structure
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Simplified Directory Cards...\n');

let allTestsPassed = true;

// Test 1: Check Card Structure
console.log('📋 Test 1: Checking Card Structure...');
const cardFile = path.join(process.cwd(), 'src/components/directory/CardNominee.tsx');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Required elements for simplified card
  const requiredElements = [
    'w-20 h-20',           // Photo size
    'rounded-full',        // Circular photo
    'nomineeData.name',    // Name display
    'nomination.category', // Subcategory
    'nomination.votes',    // Vote count
    'View',                // View button text
    'text-center',         // Centered layout
    'space-y-3'            // Proper spacing
  ];
  
  let missingElements = [];
  requiredElements.forEach(element => {
    if (!content.includes(element)) {
      missingElements.push(element);
    }
  });
  
  if (missingElements.length > 0) {
    console.log(`❌ Card missing required elements: ${missingElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has all required elements');
  }
} else {
  console.log('❌ CardNominee component not found');
  allTestsPassed = false;
}

// Test 2: Check Removed Elements
console.log('\n📋 Test 2: Checking Removed Elements...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Elements that should be removed
  const removedElements = [
    'Building',            // Building icon
    'MapPin',              // Location icon
    'ExternalLink',        // External link icon
    'nomineeData.title',   // Job title
    'nomineeData.country', // Country info
    'View Profile'         // Long button text
  ];
  
  let foundRemovedElements = [];
  removedElements.forEach(element => {
    if (content.includes(element)) {
      foundRemovedElements.push(element);
    }
  });
  
  if (foundRemovedElements.length > 0) {
    console.log(`❌ Card still contains removed elements: ${foundRemovedElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ All unnecessary elements have been removed');
  }
}

// Test 3: Check Layout Structure
console.log('\n📋 Test 3: Checking Layout Structure...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Layout structure elements
  const layoutElements = [
    'text-center space-y-3',  // Centered layout with spacing
    'flex justify-center',    // Centered photo container
    'line-clamp-2',          // Name text clamping
    'w-full',                // Full width button
  ];
  
  let missingLayout = [];
  layoutElements.forEach(element => {
    if (!content.includes(element)) {
      missingLayout.push(element);
    }
  });
  
  if (missingLayout.length > 0) {
    console.log(`❌ Card missing layout elements: ${missingLayout.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has proper centered layout structure');
  }
}

// Test 4: Check Essential Information Only
console.log('\n📋 Test 4: Checking Essential Information...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Count of essential elements (should be exactly 5)
  const essentialInfo = [
    'Photo',     // Image/avatar
    'Name',      // Nominee name
    'Category',  // Subcategory badge
    'Votes',     // Vote count
    'Button'     // View button
  ];
  
  // Check that we have the right structure
  const hasPhoto = content.includes('w-20 h-20') && content.includes('rounded-full');
  const hasName = content.includes('nomineeData.name');
  const hasCategory = content.includes('nomination.category');
  const hasVotes = content.includes('nomination.votes');
  const hasButton = content.includes('View') && content.includes('w-full');
  
  const essentialCount = [hasPhoto, hasName, hasCategory, hasVotes, hasButton].filter(Boolean).length;
  
  if (essentialCount !== 5) {
    console.log(`❌ Card should have exactly 5 essential elements, found ${essentialCount}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card contains exactly the 5 essential elements');
  }
}

// Test 5: Check Consistent Styling
console.log('\n📋 Test 5: Checking Consistent Styling...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Styling consistency elements
  const stylingElements = [
    'border-2 border-slate-200',     // Consistent borders
    'group-hover:border-orange-200', // Hover effects
    'hover:shadow-lg',               // Shadow on hover
    'transition-all duration-300',   // Smooth transitions
    'bg-white'                       // White background
  ];
  
  let missingStyling = [];
  stylingElements.forEach(element => {
    if (!content.includes(element)) {
      missingStyling.push(element);
    }
  });
  
  if (missingStyling.length > 0) {
    console.log(`❌ Card missing styling elements: ${missingStyling.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has consistent styling with other components');
  }
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 Directory cards successfully simplified!');
  console.log('\n✨ Card structure:');
  console.log('   1. 📸 Photo (circular, 80x80px)');
  console.log('   2. 👤 Name (centered, 2-line max)');
  console.log('   3. 🏷️  Subcategory (badge)');
  console.log('   4. 🗳️  Vote count (with icon)');
  console.log('   5. 👁️  View button (full width)');
  console.log('\n🎯 Clean, focused design with essential info only');
} else {
  console.log('❌ Some issues with card simplification. Please review above.');
  process.exit(1);
}

console.log('\n🚀 Directory cards are now clean and focused!');