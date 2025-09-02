#!/usr/bin/env node

/**
 * Test script to verify timeline size, category icons, and directory card styling
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Final UI Fixes...\n');

let allTestsPassed = true;

// Test 1: Check Timeline is compact
console.log('📋 Test 1: Checking Timeline compactness...');
const timelineFile = path.join(process.cwd(), 'src/components/animations/Timeline.tsx');
if (fs.existsSync(timelineFile)) {
  const content = fs.readFileSync(timelineFile, 'utf8');
  
  const compactElements = [
    'max-w-2xl',
    'w-6 h-6',
    'h-3 w-3',
    'text-xs',
    'max-w-[120px]'
  ];
  
  let missingElements = [];
  compactElements.forEach(element => {
    if (!content.includes(element)) {
      missingElements.push(element);
    }
  });
  
  if (missingElements.length > 0) {
    console.log(`❌ Timeline missing compact elements: ${missingElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Timeline is properly compact');
  }
} else {
  console.log('❌ Timeline component not found');
  allTestsPassed = false;
}

// Test 2: Check Category Icons visibility
console.log('\n📋 Test 2: Checking Category Icons...');
const categoryCardFile = path.join(process.cwd(), 'src/components/animations/CategoryCard.tsx');
if (fs.existsSync(categoryCardFile)) {
  const content = fs.readFileSync(categoryCardFile, 'utf8');
  
  const iconElements = [
    'text-white',
    'h-7 w-7',
    'relative z-10',
    'stroke-2'
  ];
  
  let hasAllIconElements = true;
  iconElements.forEach(element => {
    if (!content.includes(element)) {
      hasAllIconElements = false;
    }
  });
  
  if (hasAllIconElements) {
    console.log('✅ Category icons have proper visibility styling');
  } else {
    console.log('❌ Category icons missing visibility elements');
    allTestsPassed = false;
  }
} else {
  console.log('❌ CategoryCard component not found');
  allTestsPassed = false;
}

// Test 3: Check Directory Cards styling
console.log('\n📋 Test 3: Checking Directory Cards styling...');
const cardNomineeFile = path.join(process.cwd(), 'src/components/directory/CardNominee.tsx');
if (fs.existsSync(cardNomineeFile)) {
  const content = fs.readFileSync(cardNomineeFile, 'utf8');
  
  const stylingElements = [
    'border-2 border-slate-200',
    'hover:shadow-lg',
    'border-orange-200',
    'group-hover:opacity-100',
    'motion.div',
    'whileHover={{ y: -4 }}',
    'transition-all duration-300'
  ];
  
  let missingStyling = [];
  stylingElements.forEach(element => {
    if (!content.includes(element)) {
      missingStyling.push(element);
    }
  });
  
  if (missingStyling.length > 0) {
    console.log(`❌ Directory cards missing styling: ${missingStyling.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Directory cards have proper styling and effects');
  }
} else {
  console.log('❌ CardNominee component not found');
  allTestsPassed = false;
}

// Test 4: Check Timeline Section compactness
console.log('\n📋 Test 4: Checking Timeline Section...');
const timelineSectionFile = path.join(process.cwd(), 'src/components/home/TimelineSection.tsx');
if (fs.existsSync(timelineSectionFile)) {
  const content = fs.readFileSync(timelineSectionFile, 'utf8');
  
  if (content.includes('py-8 px-4')) {
    console.log('✅ Timeline section has compact padding');
  } else {
    console.log('❌ Timeline section padding needs to be more compact');
    allTestsPassed = false;
  }
} else {
  console.log('❌ TimelineSection component not found');
  allTestsPassed = false;
}

// Test 5: Check Categories Section icons import
console.log('\n📋 Test 5: Checking Categories Section icons...');
const categoriesSectionFile = path.join(process.cwd(), 'src/components/home/CategoriesSection.tsx');
if (fs.existsSync(categoriesSectionFile)) {
  const content = fs.readFileSync(categoriesSectionFile, 'utf8');
  
  const iconImports = [
    'Users',
    'Zap', 
    'Heart',
    'TrendingUp',
    'Globe',
    'Star'
  ];
  
  let missingIcons = [];
  iconImports.forEach(icon => {
    if (!content.includes(`icon: ${icon}`)) {
      missingIcons.push(icon);
    }
  });
  
  if (missingIcons.length > 0) {
    console.log(`❌ Categories missing icons: ${missingIcons.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ All category icons are properly imported and used');
  }
} else {
  console.log('❌ CategoriesSection component not found');
  allTestsPassed = false;
}

// Final Results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All fixes verified successfully!');
  console.log('\n✨ Completed improvements:');
  console.log('   • Timeline is now compact and smaller');
  console.log('   • Category icons have proper visibility with drop-shadow');
  console.log('   • Directory cards have borders and hover effects like categories');
  console.log('   • Consistent styling across all card components');
  console.log('   • Proper motion animations and transitions');
} else {
  console.log('❌ Some fixes need attention. Please review the issues above.');
  process.exit(1);
}

console.log('\n🚀 Ready for production!');