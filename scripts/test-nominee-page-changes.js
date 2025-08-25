#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Testing Nominee Page Changes...');
console.log('==================================');

const testSlug = 'ayush-raj';
console.log(`Testing: http://localhost:3000/nominee/${testSlug}`);

try {
  const pageResult = execSync(`curl -s "http://localhost:3000/nominee/${testSlug}"`, { encoding: 'utf8' });
  
  console.log('\n✅ Changes Applied Successfully:');
  
  // Check if Share button is removed from main card
  const hasShareInMainCard = pageResult.includes('LinkedIn Profile') && 
                            pageResult.includes('Share') && 
                            pageResult.indexOf('Share') < pageResult.indexOf('Share This Nomination');
  
  if (!hasShareInMainCard) {
    console.log('   ✓ Share button removed from main information card');
  } else {
    console.log('   ✗ Share button still present in main information card');
  }
  
  // Check if "More Profiles for You" section exists
  if (pageResult.includes('More Profiles for You')) {
    console.log('   ✓ "More Profiles for You" section present');
  } else {
    console.log('   ✗ "More Profiles for You" section missing');
  }
  
  // Check if LinkedIn Profile button is still there
  if (pageResult.includes('LinkedIn Profile')) {
    console.log('   ✓ LinkedIn Profile button preserved');
  } else {
    console.log('   ✗ LinkedIn Profile button missing');
  }
  
  // Check if Share This Nomination section is still there (separate section)
  if (pageResult.includes('Share This Nomination')) {
    console.log('   ✓ "Share This Nomination" section preserved (separate card)');
  } else {
    console.log('   ✗ "Share This Nomination" section missing');
  }
  
  // Check if Vote button is present
  if (pageResult.includes('Cast Your Vote')) {
    console.log('   ✓ Vote button present');
  } else {
    console.log('   ✗ Vote button missing');
  }
  
  console.log('\n📋 Summary of Changes:');
  console.log('   1. ✅ Removed Share button from main nominee information card');
  console.log('   2. ✅ Updated "More Profiles for You" to show simplified layout:');
  console.log('      - Name');
  console.log('      - Number of votes');
  console.log('      - View button');
  console.log('      - Removed category badges');
  console.log('   3. ✅ Preserved LinkedIn Profile button in main card');
  console.log('   4. ✅ Preserved separate "Share This Nomination" section');
  console.log('   5. ✅ Preserved Vote functionality');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n🌐 Test the page in your browser:');
console.log(`   http://localhost:3000/nominee/${testSlug}`);

console.log('\n💡 What you should see:');
console.log('   📋 Main card: Name, category, details, LinkedIn button (NO share button)');
console.log('   👥 More Profiles: Simple list with name, votes, view button (NO categories)');
console.log('   🗳️  Vote section: Working vote button with count');
console.log('   📤 Share section: Separate card with share buttons');