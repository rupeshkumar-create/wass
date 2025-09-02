#!/usr/bin/env node

/**
 * Test admin dialog button visibility
 */

const fs = require('fs');
const path = require('path');

function testAdminDialogButtons() {
  console.log('🔍 Testing Admin Dialog Button Visibility');
  console.log('==========================================');
  
  const filePath = path.join(__dirname, '../src/components/admin/EnhancedEditDialog.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ EnhancedEditDialog.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('\n✅ BUTTON VISIBILITY CHECKS:');
  
  // Check for proper modal structure
  if (content.includes('max-h-[90vh]') && content.includes('min-h-[500px]')) {
    console.log('✅ Modal has proper height constraints');
  } else {
    console.log('❌ Modal height constraints missing');
  }
  
  // Check for flex layout
  if (content.includes('flex flex-col')) {
    console.log('✅ Modal uses flex column layout');
  } else {
    console.log('❌ Modal flex layout missing');
  }
  
  // Check for footer positioning
  if (content.includes('mt-auto flex-shrink-0')) {
    console.log('✅ Footer is positioned at bottom and non-shrinking');
  } else {
    console.log('❌ Footer positioning not optimal');
  }
  
  // Check for content overflow handling
  if (content.includes('overflow-y-auto') && content.includes('min-h-0')) {
    console.log('✅ Content area has proper overflow handling');
  } else {
    console.log('❌ Content overflow handling needs improvement');
  }
  
  // Check for button styling
  const cancelButton = content.match(/Cancel.*?button>/s);
  const saveButton = content.match(/Save Changes.*?button>/s);
  
  if (cancelButton && saveButton) {
    console.log('✅ Both Cancel and Save buttons found');
    
    // Check button padding
    if (content.includes('px-6 py-3')) {
      console.log('✅ Buttons have adequate padding for visibility');
    } else {
      console.log('⚠️  Buttons might need more padding');
    }
    
    // Check for transitions
    if (content.includes('transition-colors')) {
      console.log('✅ Buttons have smooth transitions');
    } else {
      console.log('⚠️  Button transitions missing');
    }
    
    // Check for shadow on save button
    if (content.includes('shadow-sm')) {
      console.log('✅ Save button has shadow for prominence');
    } else {
      console.log('⚠️  Save button could use shadow for visibility');
    }
  } else {
    console.log('❌ Buttons not found or malformed');
  }
  
  // Check for brand colors
  if (content.includes('bg-brand-500') && content.includes('hover:bg-brand-600')) {
    console.log('✅ Save button uses brand orange colors');
  } else {
    console.log('❌ Save button not using brand colors');
  }
  
  console.log('\n🎯 LAYOUT STRUCTURE:');
  console.log('- Modal: Fixed positioning with backdrop');
  console.log('- Container: Flex column with height constraints');
  console.log('- Header: Fixed at top');
  console.log('- Content: Scrollable middle section');
  console.log('- Footer: Fixed at bottom with buttons');
  
  console.log('\n🧪 TESTING STEPS:');
  console.log('1. Open http://localhost:3000/admin');
  console.log('2. Click "Edit" on any nomination');
  console.log('3. Check if both Cancel and Save buttons are visible at bottom');
  console.log('4. Try scrolling content - buttons should stay visible');
  console.log('5. Test button interactions (hover, click)');
  
  console.log('\n✨ EXPECTED RESULTS:');
  console.log('- Buttons always visible at bottom of modal');
  console.log('- Save button is orange (brand color)');
  console.log('- Cancel button is gray/white');
  console.log('- Buttons have proper hover effects');
  console.log('- Modal content scrolls without hiding buttons');
}

testAdminDialogButtons();