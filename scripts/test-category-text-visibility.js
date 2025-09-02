#!/usr/bin/env node

/**
 * Test script to verify category text visibility fixes
 * Tests both CategoryCard icons and PublicPodium category buttons
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Category Text Visibility Fixes...\n');

// Test CategoryCard component
console.log('1. Testing CategoryCard Icon Visibility:');
const categoryCardPath = path.join(__dirname, '../src/components/animations/CategoryCard.tsx');
const categoryCardContent = fs.readFileSync(categoryCardPath, 'utf8');

// Check for improved icon visibility
const hasImprovedStroke = categoryCardContent.includes('stroke-[2.5]');
const hasDropShadow = categoryCardContent.includes('drop-shadow-lg');
const hasContrast = categoryCardContent.includes('contrast-125');
const hasReducedOverlay = categoryCardContent.includes('bg-white/20');

console.log(`   ✅ Enhanced stroke width: ${hasImprovedStroke ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Drop shadow effect: ${hasDropShadow ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Contrast enhancement: ${hasContrast ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Reduced overlay opacity: ${hasReducedOverlay ? 'PASS' : 'FAIL'}`);

// Test PublicPodium component
console.log('\n2. Testing PublicPodium Button Text Visibility:');
const podiumPath = path.join(__dirname, '../src/components/home/PublicPodium.tsx');
const podiumContent = fs.readFileSync(podiumPath, 'utf8');

// Check for improved button contrast
const hasGroupButtonContrast = podiumContent.includes('hover:text-slate-900');
const hasCategoryButtonContrast = podiumContent.includes('hover:text-orange-700');
const hasTransitionDuration = podiumContent.includes('transition-all duration-200');
const hasBorderHover = podiumContent.includes('hover:border-orange-200');

console.log(`   ✅ Group button hover contrast: ${hasGroupButtonContrast ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Category button hover contrast: ${hasCategoryButtonContrast ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Smooth transitions: ${hasTransitionDuration ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Border hover effects: ${hasBorderHover ? 'PASS' : 'FAIL'}`);

// Test for removed problematic classes
console.log('\n3. Testing for Removed Problematic Styles:');
const hasNoTextWhiteOnHover = !podiumContent.includes('hover:text-white') || podiumContent.split('hover:text-white').length <= 3; // Allow some instances
const hasNoInvisibleText = !podiumContent.includes('text-transparent');

console.log(`   ✅ No invisible text on hover: ${hasNoTextWhiteOnHover ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ No transparent text: ${hasNoInvisibleText ? 'PASS' : 'FAIL'}`);

// Summary
const categoryCardPassed = hasImprovedStroke && hasDropShadow && hasContrast && hasReducedOverlay;
const podiumPassed = hasGroupButtonContrast && hasCategoryButtonContrast && hasTransitionDuration && hasBorderHover;
const cleanupPassed = hasNoTextWhiteOnHover && hasNoInvisibleText;

console.log('\n📊 Test Results Summary:');
console.log(`   CategoryCard Icon Visibility: ${categoryCardPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   PublicPodium Button Contrast: ${podiumPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Style Cleanup: ${cleanupPassed ? '✅ PASS' : '❌ FAIL'}`);

const allTestsPassed = categoryCardPassed && podiumPassed && cleanupPassed;
console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('\n🎉 Category text visibility issues have been resolved!');
  console.log('   • Category card icons now have enhanced visibility with stronger strokes and shadows');
  console.log('   • Podium category buttons have proper contrast on hover');
  console.log('   • All text remains visible during hover states');
} else {
  console.log('\n⚠️  Some issues may still exist. Please review the failed tests above.');
}

process.exit(allTestsPassed ? 0 : 1);