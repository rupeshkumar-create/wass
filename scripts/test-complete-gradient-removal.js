#!/usr/bin/env node

/**
 * Test script to verify complete removal of all gradient effects
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Complete Gradient Removal...\n');

let allTestsPassed = true;

// Test 1: Check Hero Section - Absolutely No Gradients
console.log('📋 Test 1: Checking Hero Section for ANY gradient effects...');
const heroFile = path.join(process.cwd(), 'src/components/animations/AnimatedHero.tsx');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  
  // Check for ANY gradient-like patterns
  const gradientPatterns = [
    /bg-.*\/\d+/g,           // Any background with opacity (bg-slate-50/30)
    /bg-gradient/g,          // Gradient backgrounds
    /from-.*to-/g,           // Gradient directions
    /via-/g,                 // Gradient middle points
    /blur-xl.*opacity/g,     // Blurred elements with opacity
    /rounded-full.*blur/g    // Floating blurred elements
  ];
  
  let hasAnyGradientEffects = false;
  let foundEffects = [];
  
  gradientPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      hasAnyGradientEffects = true;
      foundEffects.push(`Pattern ${index + 1}: ${matches.join(', ')}`);
    }
  });
  
  // Check for pure white background only
  const hasPureWhite = content.includes('bg-white');
  const noFloatingElements = !content.includes('floating') && !content.includes('blur-xl');
  
  if (hasAnyGradientEffects) {
    console.log(`❌ Hero section still has gradient-like effects: ${foundEffects.join('; ')}`);
    allTestsPassed = false;
  } else if (!hasPureWhite) {
    console.log('❌ Hero section does not have pure white background');
    allTestsPassed = false;
  } else if (!noFloatingElements) {
    console.log('❌ Hero section still has floating/blur elements');
    allTestsPassed = false;
  } else {
    console.log('✅ Hero section is completely clean - pure white background only');
  }
} else {
  console.log('❌ AnimatedHero component not found');
  allTestsPassed = false;
}

// Test 2: Check for Clean Background Structure
console.log('\n📋 Test 2: Checking Background Structure...');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  
  // Should only have simple white background
  const expectedStructure = [
    'bg-white',
    'absolute inset-0'
  ];
  
  let hasCleanStructure = true;
  expectedStructure.forEach(element => {
    if (!content.includes(element)) {
      hasCleanStructure = false;
    }
  });
  
  // Should NOT have these elements
  const forbiddenElements = [
    'bg-slate-50/30',
    'opacity-30',
    'opacity-20',
    'blur-xl',
    'floating'
  ];
  
  let hasForbiddenElements = false;
  forbiddenElements.forEach(element => {
    if (content.includes(element)) {
      hasForbiddenElements = true;
    }
  });
  
  if (!hasCleanStructure) {
    console.log('❌ Hero section missing clean background structure');
    allTestsPassed = false;
  } else if (hasForbiddenElements) {
    console.log('❌ Hero section still contains forbidden gradient elements');
    allTestsPassed = false;
  } else {
    console.log('✅ Hero section has clean, simple background structure');
  }
}

// Test 3: Scan All Components for Gradients
console.log('\n📋 Test 3: Scanning ALL components for gradients...');
const allFiles = [
  'src/app/page.tsx',
  'src/components/animations/AnimatedHero.tsx',
  'src/components/animations/CategoryCard.tsx',
  'src/components/home/CategoriesSection.tsx',
  'src/components/home/PublicPodium.tsx',
  'src/components/animations/Timeline.tsx'
];

let filesWithGradients = [];
allFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Comprehensive gradient check
    if (/bg-gradient|from-.*to-|via-|\/\d+.*blur/.test(content)) {
      filesWithGradients.push(file);
    }
  }
});

if (filesWithGradients.length > 0) {
  console.log(`❌ Files still containing gradients: ${filesWithGradients.join(', ')}`);
  allTestsPassed = false;
} else {
  console.log('✅ No gradient effects found in any component');
}

// Test 4: Check Hero Section Content
console.log('\n📋 Test 4: Verifying Hero Section Content...');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  
  // Should have these essential elements
  const essentialElements = [
    'World Staffing Awards',
    '2026',
    'text-orange-500',
    'Submit Nomination',
    'View Nominees'
  ];
  
  let missingElements = [];
  essentialElements.forEach(element => {
    if (!content.includes(element)) {
      missingElements.push(element);
    }
  });
  
  if (missingElements.length > 0) {
    console.log(`❌ Hero section missing essential elements: ${missingElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Hero section has all essential content');
  }
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 Complete gradient removal verified!');
  console.log('\n✨ Hero section is now:');
  console.log('   • Pure white background (bg-white)');
  console.log('   • No gradient overlays or effects');
  console.log('   • No floating/blur elements');
  console.log('   • Clean, professional appearance');
  console.log('   • All essential content preserved');
} else {
  console.log('❌ Some gradient effects still remain. Please review the issues above.');
  process.exit(1);
}

console.log('\n🚀 Hero section is completely clean!');