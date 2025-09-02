#!/usr/bin/env node

/**
 * Test Nominee Page Content
 * Tests if nominee pages are rendering content properly
 */

async function testNomineePageContent() {
  console.log('🧪 Testing Nominee Page Content...');
  console.log('='.repeat(50));
  
  try {
    // Test a specific nominee page
    const slug = 'ayush';
    console.log(`\\n1️⃣ Testing nominee page: ${slug}`);
    
    // First test the API
    const apiResponse = await fetch(`http://localhost:3000/api/nominee/${slug}`);
    if (!apiResponse.ok) {
      console.log('❌ API failed');
      return;
    }
    
    const apiData = await apiResponse.json();
    console.log('✅ API working');
    console.log(`   Nominee name: ${apiData.nominee.name}`);
    console.log(`   Category: ${apiData.category}`);
    
    // Test the page
    const pageResponse = await fetch(`http://localhost:3000/nominee/${slug}`);
    if (!pageResponse.ok) {
      console.log('❌ Page failed to load');
      return;
    }
    
    const pageContent = await pageResponse.text();
    console.log('✅ Page loaded');
    
    // Check for key content
    const checks = [
      { name: 'Nominee name', content: apiData.nominee.name, found: pageContent.includes(apiData.nominee.name) },
      { name: 'Category', content: apiData.category, found: pageContent.includes(apiData.category) },
      { name: 'Vote button', content: 'Cast Your Vote', found: pageContent.includes('Cast Your Vote') },
      { name: 'LinkedIn link', content: 'LinkedIn Profile', found: pageContent.includes('LinkedIn Profile') },
      { name: 'React hydration', content: '__NEXT_DATA__', found: pageContent.includes('__NEXT_DATA__') }
    ];
    
    console.log('\\n📋 Content checks:');
    checks.forEach(check => {
      if (check.found) {
        console.log(`   ✅ ${check.name}: Found`);
      } else {
        console.log(`   ❌ ${check.name}: Missing`);
      }
    });
    
    // Check for errors in the HTML
    if (pageContent.includes('Error:') || pageContent.includes('error')) {
      console.log('\\n⚠️  Potential errors found in page content');
    }
    
    // Check if it's a client-side rendering issue
    if (pageContent.includes('__NEXT_DATA__') && !pageContent.includes(apiData.nominee.name)) {
      console.log('\\n🔍 Diagnosis: Page loads but content missing - likely client-side rendering issue');
      console.log('   This could be due to:');
      console.log('   - JavaScript errors preventing hydration');
      console.log('   - API fetch failing on client side');
      console.log('   - Component rendering errors');
    }
    
    console.log('\\n🎉 Nominee page content test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNomineePageContent();