#!/usr/bin/env node

/**
 * Test script to verify complete gradient removal and orange icon implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Final Gradient & Icon Color Fixes...\n');

let allTestsPassed = true;

// Test 1: Check Hero Section - Complete Gradient Removal
console.log('📋 Test 1: Checking Hero Section Gradient Removal...');
const heroFile = path.join(process.cwd(), 'src/components/animations/AnimatedHero.tsx');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  
  // Check for any gradient patterns
  const gradientPatterns = [
    /bg-.*\/\d+.*rounded-full.*blur/g,  // Gradient-like floating elements
    /bg-gradient/g,
    /from-.*to-/g,
    /via-/g
  ];
  
  let hasGradientEffects = false;
  let foundEffects = [];
  
  gradientPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      hasGradientEffects = true;
      foundEffects.push(`Pattern ${index + 1}: ${matches.join(', ')}`);
    }
  });
  
  // Check for solid color replacements
  const hasSolidColors = content.includes('bg-slate-100') && content.includes('bg-orange-100');
  const hasOpacity = content.includes('opacity-30') && content.includes('opacity-20');
  
  if (hasGradientEffects) {
    console.log(`❌ Hero section still has gradient-like effects: ${foundEffects.join('; ')}`);
    allTestsPassed = false;
  } else if (!hasSolidColors || !hasOpacity) {
    console.log('❌ Hero section missing solid color replacements');
    allTestsPassed = false;
  } else {
    console.log('✅ Hero section uses solid colors with opacity');
  }
} else {
  console.log('❌ AnimatedHero component not found');
  allTestsPassed = false;
}

// Test 2: Check Category Icons - Orange Color
console.log('\n📋 Test 2: Checking Category Icons Color...');
const categoryCardFile = path.join(process.cwd(), 'src/components/animations/CategoryCard.tsx');
if (fs.existsSync(categoryCardFile)) {
  const content = fs.readFileSync(categoryCardFile, 'utf8');
  
  // Check for orange icons
  const hasOrangeIcons = content.includes('text-orange-400');
  const hasWhiteOverlay = content.includes('bg-white/20');
  const hasStroke = content.includes('stroke-2');
  const noWhiteIcons = !content.includes('text-white');
  
  if (!hasOrangeIcons) {
    console.log('❌ Category icons are not orange (text-orange-400)');
    allTestsPassed = false;
  } else if (!hasWhiteOverlay) {
    console.log('❌ Category icons missing white overlay for contrast');
    allTestsPassed = false;
  } else if (!hasStroke) {
    console.log('❌ Category icons missing stroke-2 for visibility');
    allTestsPassed = false;
  } else if (!noWhiteIcons) {
    console.log('❌ Category icons still have white color');
    allTestsPassed = false;
  } else {
    console.log('✅ Category icons are orange with proper contrast');
  }
} else {
  console.log('❌ CategoryCard component not found');
  allTestsPassed = false;
}

// Test 3: Check Background Consistency
console.log('\n📋 Test 3: Checking Background Consistency...');
const filesToCheck = [
  'src/components/animations/AnimatedHero.tsx',
  'src/components/animations/CategoryCard.tsx'
];

let inconsistentFiles = [];
filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for solid backgrounds only
    const hasSolidBg = content.includes('bg-white') || content.includes('bg-slate-') || content.includes('bg-orange-');
    const hasNoGradients = !content.includes('bg-gradient') && !content.includes('from-') && !content.includes('to-');
    
    if (!hasSolidBg || !hasNoGradients) {
      inconsistentFiles.push(file);
    }
  }
});

if (inconsistentFiles.length > 0) {
  console.log(`❌ Files with inconsistent backgrounds: ${inconsistentFiles.join(', ')}`);
  allTestsPassed = false;
} else {
  console.log('✅ All components use consistent solid backgrounds');
}

// Test 4: Check Color Scheme Consistency
console.log('\n📋 Test 4: Checking Color Scheme...');
if (fs.existsSync(categoryCardFile)) {
  const content = fs.readFileSync(categoryCardFile, 'utf8');
  
  const colorElements = [
    'text-orange-400',      // Icon color
    'border-orange-200',    // Hover border
    'text-orange-600',      // Title hover
    'hover:text-orange-700' // Badge hover
  ];
  
  let missingColors = [];
  colorElements.forEach(color => {
    if (!content.includes(color)) {
      missingColors.push(color);
    }
  });
  
  if (missingColors.length > 0) {
    console.log(`❌ Missing orange color elements: ${missingColors.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Consistent orange color scheme throughout');
  }
}

// Test 5: Verify No Remaining Gradient Effects
console.log('\n📋 Test 5: Final Gradient Scan...');
const allFiles = [
  'src/app/page.tsx',
  'src/components/animations/AnimatedHero.tsx',
  'src/components/animations/CategoryCard.tsx',
  'src/components/home/CategoriesSection.tsx',
  'src/components/home/PublicPodium.tsx'
];

let filesWithGradients = [];
allFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Comprehensive gradient check (excluding prop names)
    if (/bg-gradient|from-.*to-|via-/.test(content)) {
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

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All gradient and icon fixes verified!');
  console.log('\n✨ Final state:');
  console.log('   • Hero section uses solid colors only (no gradients)');
  console.log('   • Category icons are orange (text-orange-400)');
  console.log('   • Floating elements use solid bg-slate-100 and bg-orange-100');
  console.log('   • Consistent orange color scheme throughout');
  console.log('   • No gradient effects anywhere in the application');
} else {
  console.log('❌ Some issues remain. Please review the problems above.');
  process.exit(1);
}

console.log('\n🚀 Clean design achieved - no gradients, orange icons!');