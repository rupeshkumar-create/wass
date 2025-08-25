#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Testing Share Buttons Functionality...');
console.log('=========================================');

const testSlug = 'ayush-raj';
console.log(`Testing nominee: http://localhost:3000/nominee/${testSlug}`);

try {
  const pageResult = execSync(`curl -s "http://localhost:3000/nominee/${testSlug}"`, { encoding: 'utf8' });
  
  console.log('\n✅ Share Buttons Verification:');
  
  // Check if all share buttons are present
  const hasEmailButton = pageResult.includes('Email');
  const hasLinkedInButton = pageResult.includes('LinkedIn');
  const hasTwitterButton = pageResult.includes('Twitter');
  const hasCopyButton = pageResult.includes('Copy Link') || pageResult.includes('Copy');
  
  if (hasEmailButton) {
    console.log('   ✓ Email share button present');
  } else {
    console.log('   ✗ Email share button missing');
  }
  
  if (hasLinkedInButton) {
    console.log('   ✓ LinkedIn share button present');
  } else {
    console.log('   ✗ LinkedIn share button missing');
  }
  
  if (hasTwitterButton) {
    console.log('   ✓ Twitter share button present');
  } else {
    console.log('   ✗ Twitter share button missing');
  }
  
  if (hasCopyButton) {
    console.log('   ✓ Copy Link button present');
  } else {
    console.log('   ✗ Copy Link button missing');
  }
  
  // Check if Share This Nomination section exists
  const hasShareSection = pageResult.includes('Share This Nomination') || pageResult.includes('Share this nomination');
  
  if (hasShareSection) {
    console.log('   ✓ "Share This Nomination" section present');
  } else {
    console.log('   ✗ "Share This Nomination" section missing');
  }
  
  console.log('\n📋 Share Button Features:');
  console.log('   📧 Email: Opens email client with pre-filled subject and body');
  console.log('   💼 LinkedIn: Opens LinkedIn sharing dialog');
  console.log('   🐦 Twitter: Opens Twitter compose with pre-filled text');
  console.log('   📋 Copy Link: Copies nominee URL to clipboard');
  
  const allButtonsPresent = hasEmailButton && hasLinkedInButton && hasTwitterButton && hasCopyButton && hasShareSection;
  
  if (allButtonsPresent) {
    console.log('\n🎉 SUCCESS: All share buttons are present and ready to use!');
  } else {
    console.log('\n⚠️  Some share buttons may be missing - please check the implementation');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n🌐 Test the share buttons manually:');
console.log(`   http://localhost:3000/nominee/${testSlug}`);

console.log('\n💡 How to test each button:');
console.log('   1. 📧 Email: Click and verify email client opens with correct content');
console.log('   2. 💼 LinkedIn: Click and verify LinkedIn sharing dialog opens');
console.log('   3. 🐦 Twitter: Click and verify Twitter compose opens with text');
console.log('   4. 📋 Copy Link: Click and verify "Copied!" message appears');

console.log('\n🔗 Expected URLs should be in format:');
console.log(`   http://localhost:3000/nominee/${testSlug}`);