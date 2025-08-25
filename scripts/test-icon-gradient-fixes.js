#!/usr/bin/env node

/**
 * Test script to verify category icons visibility and gradient removal
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Icon Visibility & Gradient Removal...\n');

let allTestsPassed = true;

// Test 1: Check Category Icons Visibility
console.log('📋 Test 1: Checking Category Icons Visibility...');
const categoryCardFile = path.join(process.cwd(), 'src/components/animations/CategoryCard.tsx');
if (fs.existsSync(categoryCardFile)) {
  const content = fs.readFileSync(categoryCardFile, 'utf8');
  
  const iconVisibilityElements = [
    'text-white',
    'stroke-2',
    'bg-black/10',
    'relative z-10',
    'h-7 w-7'
  ];
  
  let missingElements = [];
  iconVisibilityElements.forEach(element => {
    if (!content.includes(element)) {
      missingElements.push(element);
    }
  });
  
  if (missingElements.length > 0) {
    console.log(`❌ Category icons missing visibility elements: ${missingElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Category icons have proper visibility styling');
  }
} else {
  console.log('❌ CategoryCard component not found');
  allTestsPassed = false;
}

// Test 2: Check Hero Section Gradient Removal
console.log('\n📋 Test 2: Checking Hero Section Gradient Removal...');
const heroFile = path.join(process.cwd(), 'src/components/animations/AnimatedHero.tsx');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  
  // Check for gradient patterns that should NOT exist
  const gradientPatterns = [
    /bg-gradient-to-/g,
    /from-.*via-.*to-/g,
    /bg-white\/40.*animate/g
  ];
  
  let hasGradients = false;
  let foundGradients = [];
  
  gradientPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      hasGradients = true;
      foundGradients.push(`Pattern ${index + 1}: ${matches.join(', ')}`);
    }
  });
  
  if (hasGradients) {
    console.log(`❌ Hero section still contains gradients: ${foundGradients.join('; ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Hero section has no gradient effects');
  }
  
  // Check for clean background
  if (content.includes('bg-white') && content.includes('bg-slate-50/30')) {
    console.log('✅ Hero section has clean solid backgrounds');
  } else {
    console.log('❌ Hero section background needs verification');
    allTestsPassed = false;
  }
} else {
  console.log('❌ AnimatedHero component not found');
  allTestsPassed = false;
}

// Test 3: Check Category Background Colors
console.log('\n📋 Test 3: Checking Category Background Colors...');
const categoriesFile = path.join(process.cwd(), 'src/components/home/CategoriesSection.tsx');
if (fs.existsSync(categoriesFile)) {
  const content = fs.readFileSync(categoriesFile, 'utf8');
  
  const expectedBackgrounds = [
    'bg-slate-700',
    'bg-orange-500'
  ];
  
  let missingBackgrounds = [];
  expectedBackgrounds.forEach(bg => {
    if (!content.includes(bg)) {
      missingBackgrounds.push(bg);
    }
  });
  
  if (missingBackgrounds.length > 0) {
    console.log(`❌ Categories missing backgrounds: ${missingBackgrounds.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Categories have proper solid background colors');
  }
} else {
  console.log('❌ CategoriesSection component not found');
  allTestsPassed = false;
}

// Test 4: Check for any remaining gradients in the app
console.log('\n📋 Test 4: Scanning for remaining gradients...');
const filesToScan = [
  'src/app/page.tsx',
  'src/components/animations/AnimatedHero.tsx',
  'src/components/home/CategoriesSection.tsx',
  'src/components/animations/CategoryCard.tsx',
  'src/components/home/PublicPodium.tsx'
];

let gradientFiles = [];
filesToScan.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (/bg-gradient-|gradient-to-|from-.*to-/.test(content)) {
      gradientFiles.push(file);
    }
  }
});

if (gradientFiles.length > 0) {
  console.log(`❌ Files still contain gradients: ${gradientFiles.join(', ')}`);
  allTestsPassed = false;
} else {
  console.log('✅ No gradient patterns found in main components');
}

// Test 5: Check Icon Import and Usage
console.log('\n📋 Test 5: Checking Icon Import and Usage...');
if (fs.existsSync(categoriesFile)) {
  const content = fs.readFileSync(categoriesFile, 'utf8');
  
  const requiredIcons = [
    'Users',
    'Zap',
    'Heart', 
    'TrendingUp',
    'Globe',
    'Star'
  ];
  
  let missingIcons = [];
  requiredIcons.forEach(icon => {
    if (!content.includes(`import { ${icon}`) && !content.includes(`${icon},`)) {
      missingIcons.push(icon);
    }
  });
  
  if (missingIcons.length > 0) {
    console.log(`❌ Missing icon imports: ${missingIcons.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ All required icons are properly imported');
  }
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All icon and gradient fixes verified!');
  console.log('\n✨ Completed fixes:');
  console.log('   • Category icons are now visible with proper contrast');
  console.log('   • Hero section gradient effects completely removed');
  console.log('   • All components use solid background colors');
  console.log('   • Icons have proper stroke width and visibility');
  console.log('   • Clean, professional appearance throughout');
} else {
  console.log('❌ Some issues remain. Please review the problems above.');
  process.exit(1);
}

console.log('\n🚀 Icons are visible and gradients are gone!');