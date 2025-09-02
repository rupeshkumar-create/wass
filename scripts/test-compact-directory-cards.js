#!/usr/bin/env node

/**
 * Test script to verify compact directory cards with 4 per row and square photos
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Compact Directory Cards...\n');

let allTestsPassed = true;

// Test 1: Check Card Size Reduction
console.log('📋 Test 1: Checking Card Size Reduction...');
const cardFile = path.join(process.cwd(), 'src/components/directory/CardNominee.tsx');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for smaller dimensions
  const compactElements = [
    'w-12 h-12',        // Ultra-small photo (48x48)
    'p-2',              // Ultra-small padding (8px)
    'space-y-1.5',     // Ultra-tight spacing (6px)
    'text-xs',          // Ultra-small name text
    'py-1',             // Ultra-small button padding
    'gap-0.5',          // Ultra-tight vote count gap
    'px-1.5 py-0.5'     // Ultra-small badge padding
  ];
  
  let missingCompact = [];
  compactElements.forEach(element => {
    if (!content.includes(element)) {
      missingCompact.push(element);
    }
  });
  
  if (missingCompact.length > 0) {
    console.log(`❌ Card missing compact elements: ${missingCompact.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has been made more compact');
  }
} else {
  console.log('❌ CardNominee component not found');
  allTestsPassed = false;
}

// Test 2: Check Square Photo Shape
console.log('\n📋 Test 2: Checking Square Photo Shape...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for square shape elements
  const squareElements = [
    'rounded-lg',       // Square with rounded corners (not rounded-full)
    'w-12 h-12'         // Ultra-small square dimensions
  ];
  
  let missingSquare = [];
  squareElements.forEach(element => {
    if (!content.includes(element)) {
      missingSquare.push(element);
    }
  });
  
  // Should NOT have circular elements
  const circularElements = [
    'rounded-full'      // Should not be circular
  ];
  
  let hasCircular = false;
  circularElements.forEach(element => {
    if (content.includes(element)) {
      hasCircular = true;
    }
  });
  
  if (missingSquare.length > 0) {
    console.log(`❌ Photo missing square elements: ${missingSquare.join(', ')}`);
    allTestsPassed = false;
  } else if (hasCircular) {
    console.log('❌ Photo still has circular styling');
    allTestsPassed = false;
  } else {
    console.log('✅ Photo is now square-shaped with rounded corners');
  }
}

// Test 3: Check Grid Layout for 4 Columns
console.log('\n📋 Test 3: Checking Grid Layout...');
const gridFile = path.join(process.cwd(), 'src/components/directory/Grid.tsx');
if (fs.existsSync(gridFile)) {
  const content = fs.readFileSync(gridFile, 'utf8');
  
  // Check for 4-column grid
  const gridElements = [
    'lg:grid-cols-4',   // 4 columns on large screens
    'md:grid-cols-3',   // 3 columns on medium screens
    'sm:grid-cols-2',   // 2 columns on small screens
    'gap-3'             // Ultra-small gap between cards
  ];
  
  let missingGrid = [];
  gridElements.forEach(element => {
    if (!content.includes(element)) {
      missingGrid.push(element);
    }
  });
  
  if (missingGrid.length > 0) {
    console.log(`❌ Grid missing layout elements: ${missingGrid.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Grid now supports 4 cards per row on large screens');
  }
} else {
  console.log('❌ Grid component not found');
  allTestsPassed = false;
}

// Test 4: Check Responsive Breakpoints
console.log('\n📋 Test 4: Checking Responsive Breakpoints...');
if (fs.existsSync(gridFile)) {
  const content = fs.readFileSync(gridFile, 'utf8');
  
  // Check responsive progression
  const responsiveBreakpoints = [
    'grid-cols-1',      // 1 column on mobile
    'sm:grid-cols-2',   // 2 columns on small screens
    'lg:grid-cols-3',   // 3 columns on large screens  
    'xl:grid-cols-4'    // 4 columns on extra large screens
  ];
  
  let missingBreakpoints = [];
  responsiveBreakpoints.forEach(breakpoint => {
    if (!content.includes(breakpoint)) {
      missingBreakpoints.push(breakpoint);
    }
  });
  
  if (missingBreakpoints.length > 0) {
    console.log(`❌ Grid missing responsive breakpoints: ${missingBreakpoints.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Grid has proper responsive breakpoints');
  }
}

// Test 5: Check Content Hierarchy
console.log('\n📋 Test 5: Checking Content Hierarchy...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check text size hierarchy
  const textHierarchy = [
    'text-sm',          // Name (smaller than before)
    'text-xs',          // Vote count and button (smallest)
    'leading-tight'     // Tighter line height for names
  ];
  
  let missingHierarchy = [];
  textHierarchy.forEach(element => {
    if (!content.includes(element)) {
      missingHierarchy.push(element);
    }
  });
  
  if (missingHierarchy.length > 0) {
    console.log(`❌ Card missing text hierarchy: ${missingHierarchy.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has proper text size hierarchy');
  }
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 Compact directory cards successfully implemented!');
  console.log('\n✨ Changes made:');
  console.log('   📐 Photo: 64x64px square with rounded corners');
  console.log('   📏 Size: Reduced padding and spacing throughout');
  console.log('   📱 Grid: 4 cards per row on large screens');
  console.log('   📝 Text: Smaller font sizes for compact design');
  console.log('   🎯 Layout: Responsive 1→2→3→4 column progression');
  console.log('\n📊 Responsive breakpoints:');
  console.log('   • Mobile: 1 column');
  console.log('   • Small: 2 columns');
  console.log('   • Large: 3 columns');
  console.log('   • XL: 4 columns');
} else {
  console.log('❌ Some issues with compact card implementation. Please review above.');
  process.exit(1);
}

console.log('\n🚀 Directory now shows more cards efficiently!');