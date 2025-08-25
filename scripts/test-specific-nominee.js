#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Testing Specific Nominee Pages...');
console.log('===================================');

// Test a few specific nominees
const testNominees = [
  'ayush-raj',
  'complete-flow-test-nominee-2', 
  'ayush',
  'anu-manager',
  'akash-kumar'
];

testNominees.forEach((slug, index) => {
  console.log(`\n${index + 1}️⃣ Testing: ${slug}`);
  console.log(`   URL: http://localhost:3000/nominee/${slug}`);
  
  try {
    // Test API first
    const apiResult = execSync(`curl -s "http://localhost:3000/api/nominee/${slug}"`, { encoding: 'utf8' });
    const apiData = JSON.parse(apiResult);
    console.log(`   ✅ API: ${apiData.nominee?.name || 'No name'}`);
    
    // Test page
    const pageResult = execSync(`curl -s "http://localhost:3000/nominee/${slug}"`, { encoding: 'utf8' });
    
    if (pageResult.includes('404') || pageResult.includes('This page could not be found')) {
      console.log(`   ❌ Page: Shows 404 error`);
    } else if (pageResult.includes(`Nominee: ${apiData.nominee?.name}`)) {
      console.log(`   ✅ Page: Shows nominee data correctly`);
    } else if (pageResult.includes('Nominee:')) {
      console.log(`   ⚠️  Page: Shows nominee data but name might be different`);
    } else {
      console.log(`   ❓ Page: Unknown state`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
});

console.log('\n🎯 Try these working URLs in your browser:');
testNominees.forEach(slug => {
  console.log(`   http://localhost:3000/nominee/${slug}`);
});

console.log('\n💡 If you see 404 errors, try:');
console.log('   1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)');
console.log('   2. Clear browser cache');
console.log('   3. Try in incognito/private mode');
console.log('   4. Restart the development server');