#!/usr/bin/env node

/**
 * Test script to verify categories are loading correctly
 */

const fs = require('fs');
const path = require('path');

function testCategories() {
  console.log('🧪 Testing Category Dropdown...\n');

  try {
    // Read the constants file
    const constantsPath = path.join(__dirname, '..', 'src', 'lib', 'constants.ts');
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');

    // Extract CATEGORIES array (basic parsing)
    const categoriesMatch = constantsContent.match(/export const CATEGORIES: CategoryConfig\[\] = \[([\s\S]*?)\];/);
    
    if (!categoriesMatch) {
      console.error('❌ Could not find CATEGORIES array in constants.ts');
      return;
    }

    // Count categories by parsing the content
    const categoryLines = categoriesMatch[1].split('\n').filter(line => line.trim().startsWith('{ id:'));
    
    console.log(`✅ Found ${categoryLines.length} categories in constants.ts`);
    
    // Show first few categories
    console.log('\n📋 Sample categories:');
    categoryLines.slice(0, 5).forEach((line, index) => {
      const idMatch = line.match(/id: "([^"]+)"/);
      const labelMatch = line.match(/label: "([^"]+)"/);
      const typeMatch = line.match(/type: "([^"]+)"/);
      
      if (idMatch && labelMatch && typeMatch) {
        console.log(`   ${index + 1}. ${labelMatch[1]} (${idMatch[1]}) - ${typeMatch[1]}`);
      }
    });

    if (categoryLines.length > 5) {
      console.log(`   ... and ${categoryLines.length - 5} more categories`);
    }

    // Check TopNomineesPanel component
    const panelPath = path.join(__dirname, '..', 'src', 'components', 'admin', 'TopNomineesPanel.tsx');
    const panelContent = fs.readFileSync(panelPath, 'utf8');

    // Check if it imports CATEGORIES
    if (panelContent.includes('import { CATEGORIES }')) {
      console.log('\n✅ TopNomineesPanel correctly imports CATEGORIES');
    } else {
      console.log('\n❌ TopNomineesPanel does not import CATEGORIES');
    }

    // Check if it uses category.label
    if (panelContent.includes('category.label')) {
      console.log('✅ TopNomineesPanel uses category.label (correct)');
    } else if (panelContent.includes('category.name')) {
      console.log('❌ TopNomineesPanel uses category.name (should be category.label)');
    }

    // Check z-index fix
    if (panelContent.includes('z-[100]')) {
      console.log('✅ TopNomineesPanel has z-index fix applied');
    } else {
      console.log('⚠️  TopNomineesPanel may need z-index fix for dropdown visibility');
    }

    console.log('\n🎉 Category dropdown test completed!');
    console.log('\n📋 If dropdown is still not visible, check:');
    console.log('1. Browser developer tools for CSS conflicts');
    console.log('2. Parent container overflow settings');
    console.log('3. Other elements with high z-index values');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCategories();