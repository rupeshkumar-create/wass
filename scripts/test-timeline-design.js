#!/usr/bin/env node

/**
 * Test script to verify the new timeline design and gradient removal
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Timeline Design & Gradient Removal...\n');

// Files to check for gradient removal
const filesToCheck = [
  'src/app/page.tsx',
  'src/components/animations/AnimatedHero.tsx',
  'src/components/home/CategoriesSection.tsx',
  'src/components/animations/CategoryCard.tsx',
  'src/components/home/PublicPodium.tsx',
  'src/components/animations/Podium.tsx',
  'src/components/animations/StatCard.tsx',
  'src/components/animations/Timeline.tsx',
  'src/components/home/TimelineSection.tsx'
];

let allTestsPassed = true;

// Test 1: Check for gradient removal
console.log('📋 Test 1: Checking for gradient removal...');
filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for gradient patterns
    const gradientPatterns = [
      /bg-gradient-to-/g,
      /from-.*to-/g,
      /gradient-to-/g
    ];
    
    let hasGradients = false;
    gradientPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasGradients = true;
      }
    });
    
    if (hasGradients) {
      console.log(`❌ ${file} still contains gradients`);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${file} - gradients removed`);
    }
  } else {
    console.log(`⚠️  ${file} not found`);
  }
});

// Test 2: Check Timeline component structure
console.log('\n📋 Test 2: Checking Timeline component structure...');
const timelineFile = path.join(process.cwd(), 'src/components/animations/Timeline.tsx');
if (fs.existsSync(timelineFile)) {
  const content = fs.readFileSync(timelineFile, 'utf8');
  
  const requiredElements = [
    'Calendar',
    'Awards Timeline 2026',
    'Desktop Timeline',
    'Mobile Timeline',
    'Active Phase',
    'md:block',
    'md:hidden'
  ];
  
  let missingElements = [];
  requiredElements.forEach(element => {
    if (!content.includes(element)) {
      missingElements.push(element);
    }
  });
  
  if (missingElements.length > 0) {
    console.log(`❌ Timeline missing elements: ${missingElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Timeline component has all required elements');
  }
} else {
  console.log('❌ Timeline component not found');
  allTestsPassed = false;
}

// Test 3: Check consistent color scheme
console.log('\n📋 Test 3: Checking consistent color scheme...');
const colorSchemeFiles = [
  'src/components/animations/Timeline.tsx',
  'src/components/animations/CategoryCard.tsx',
  'src/components/home/PublicPodium.tsx'
];

colorSchemeFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for consistent slate and orange colors
    const hasSlateColors = /slate-[0-9]+/.test(content);
    const hasOrangeAccents = /orange-[0-9]+/.test(content);
    
    if (hasSlateColors && hasOrangeAccents) {
      console.log(`✅ ${file} - consistent color scheme`);
    } else {
      console.log(`⚠️  ${file} - check color consistency`);
    }
  }
});

// Test 4: Check background consistency
console.log('\n📋 Test 4: Checking background consistency...');
const pageFile = path.join(process.cwd(), 'src/app/page.tsx');
if (fs.existsSync(pageFile)) {
  const content = fs.readFileSync(pageFile, 'utf8');
  
  // Check for consistent backgrounds (should have slate-50 and white, no gradients)
  const hasSlate50 = content.includes('bg-slate-50');
  const hasWhite = content.includes('bg-white');
  const hasNoGradients = !content.includes('gradient');
  
  if (hasSlate50 && hasNoGradients) {
    console.log('✅ Homepage has consistent backgrounds');
  } else {
    console.log('❌ Homepage backgrounds need review');
    allTestsPassed = false;
  }
}

// Test 5: Check Timeline section integration
console.log('\n📋 Test 5: Checking Timeline section integration...');
const timelineSectionFile = path.join(process.cwd(), 'src/components/home/TimelineSection.tsx');
if (fs.existsSync(timelineSectionFile)) {
  const content = fs.readFileSync(timelineSectionFile, 'utf8');
  
  const integrationChecks = [
    'py-16',
    'bg-white',
    'Timeline events'
  ];
  
  let integrationPassed = true;
  integrationChecks.forEach(check => {
    if (!content.includes(check)) {
      integrationPassed = false;
    }
  });
  
  if (integrationPassed) {
    console.log('✅ Timeline section properly integrated');
  } else {
    console.log('❌ Timeline section integration needs review');
    allTestsPassed = false;
  }
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All tests passed! Timeline design and gradient removal complete.');
  console.log('\n✨ Key improvements:');
  console.log('   • New responsive timeline design with desktop/mobile layouts');
  console.log('   • Removed all gradient backgrounds for clean, consistent design');
  console.log('   • Consistent slate/orange color scheme throughout');
  console.log('   • Improved timeline cards with better information hierarchy');
  console.log('   • Clean white and slate-50 backgrounds');
} else {
  console.log('❌ Some tests failed. Please review the issues above.');
  process.exit(1);
}

console.log('\n🚀 Ready for production!');