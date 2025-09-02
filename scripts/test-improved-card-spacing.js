#!/usr/bin/env node

/**
 * Test script to verify improved card spacing and visual design
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Improved Card Spacing & Design...\n');

let allTestsPassed = true;

// Test 1: Check Proper Spacing
console.log('📋 Test 1: Checking Proper Spacing...');
const cardFile = path.join(process.cwd(), 'src/components/directory/CardNominee.tsx');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for proper spacing elements
  const spacingElements = [
    'p-4',              // Adequate card padding
    'space-y-3',        // Good spacing between elements
    'mb-3',             // Margin bottom for photo
    'mb-2',             // Margin bottom for name
    'mb-3',             // Margin bottom for category and votes
    'mt-4'              // Margin top for button
  ];
  
  let missingSpacing = [];
  spacingElements.forEach(element => {
    if (!content.includes(element)) {
      missingSpacing.push(element);
    }
  });
  
  if (missingSpacing.length > 0) {
    console.log(`❌ Card missing proper spacing: ${missingSpacing.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has proper spacing between elements');
  }
} else {
  console.log('❌ CardNominee component not found');
  allTestsPassed = false;
}

// Test 2: Check Photo Size and Border
console.log('\n📋 Test 2: Checking Photo Size and Border...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for proper photo styling
  const photoElements = [
    'w-16 h-16',        // Good photo size (64x64px)
    'border-2',         // Proper border thickness
    'rounded-lg'        // Square with rounded corners
  ];
  
  let missingPhoto = [];
  photoElements.forEach(element => {
    if (!content.includes(element)) {
      missingPhoto.push(element);
    }
  });
  
  if (missingPhoto.length > 0) {
    console.log(`❌ Photo missing proper styling: ${missingPhoto.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Photo has proper size and styling');
  }
}

// Test 3: Check Button Design
console.log('\n📋 Test 3: Checking Button Design...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for proper button styling
  const buttonElements = [
    'px-4 py-1.5',      // Proper button padding
    'h-8',              // Fixed button height
    'rounded-md',       // Rounded button
    'text-xs'           // Appropriate text size
  ];
  
  let missingButton = [];
  buttonElements.forEach(element => {
    if (!content.includes(element)) {
      missingButton.push(element);
    }
  });
  
  // Should NOT have full width in button context
  const hasFullWidth = content.includes('className="w-full') || content.includes('w-full bg-slate');
  
  if (missingButton.length > 0) {
    console.log(`❌ Button missing proper styling: ${missingButton.join(', ')}`);
    allTestsPassed = false;
  } else if (hasFullWidth) {
    console.log('❌ Button should not be full width');
    allTestsPassed = false;
  } else {
    console.log('✅ Button has proper compact design');
  }
}

// Test 4: Check Text Hierarchy
console.log('\n📋 Test 4: Checking Text Hierarchy...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for proper text sizing
  const textElements = [
    'text-sm',          // Name text size
    'text-xs',          // Category and vote text size
    'font-semibold',    // Name font weight
    'line-clamp-2'      // Name line clamping
  ];
  
  let missingText = [];
  textElements.forEach(element => {
    if (!content.includes(element)) {
      missingText.push(element);
    }
  });
  
  if (missingText.length > 0) {
    console.log(`❌ Text missing proper hierarchy: ${missingText.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Text has proper hierarchy and sizing');
  }
}

// Test 5: Check Element Separation
console.log('\n📋 Test 5: Checking Element Separation...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for proper element separation
  const separationElements = [
    'mb-3',             // Photo margin bottom
    'mb-2',             // Name margin bottom  
    'mb-3',             // Category margin bottom
    'gap-1',            // Vote count gap
    'mt-4'              // Button margin top
  ];
  
  let missingSeparation = [];
  separationElements.forEach(element => {
    if (!content.includes(element)) {
      missingSeparation.push(element);
    }
  });
  
  if (missingSeparation.length > 0) {
    console.log(`❌ Elements missing proper separation: ${missingSeparation.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Elements have proper separation and breathing room');
  }
}

// Test 6: Check Visual Polish
console.log('\n📋 Test 6: Checking Visual Polish...');
if (fs.existsSync(cardFile)) {
  const content = fs.readFileSync(cardFile, 'utf8');
  
  // Check for visual polish elements
  const polishElements = [
    'hover:shadow-lg',          // Card hover effect
    'group-hover:border-orange', // Photo border hover
    'group-hover:text-orange',   // Name color hover
    'transition-colors',         // Smooth transitions
    'px-2 py-1'                 // Badge padding
  ];
  
  let missingPolish = [];
  polishElements.forEach(element => {
    if (!content.includes(element)) {
      missingPolish.push(element);
    }
  });
  
  if (missingPolish.length > 0) {
    console.log(`❌ Missing visual polish: ${missingPolish.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Card has proper visual polish and interactions');
  }
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 Card spacing and design successfully improved!');
  console.log('\n✨ Improvements made:');
  console.log('   📸 Photo: 64x64px with proper border and spacing');
  console.log('   📝 Name: Clear hierarchy with proper margins');
  console.log('   🏷️  Category: Well-spaced badge with padding');
  console.log('   🗳️  Votes: Proper icon and text spacing');
  console.log('   🔘 Button: Compact, visually appealing design');
  console.log('   📏 Spacing: Proper breathing room between all elements');
  console.log('\n🎯 Visual hierarchy:');
  console.log('   • Photo → Name → Category → Votes → Button');
  console.log('   • Each element has proper spacing and margins');
  console.log('   • Button is compact but accessible');
} else {
  console.log('❌ Some spacing issues remain. Please review above.');
  process.exit(1);
}

console.log('\n🚀 Cards now look professional and well-spaced!');