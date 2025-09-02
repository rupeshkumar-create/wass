#!/usr/bin/env node

/**
 * Test Live Nominee Pages
 * Tests individual nominee pages to identify issues
 */

async function testLiveNomineePages() {
  console.log('🧪 Testing Live Nominee Pages...');
  console.log('='.repeat(50));
  
  try {
    // Get list of approved nominations
    console.log('1️⃣ Getting approved nominations...');
    
    const nominationsResponse = await fetch('http://localhost:3000/api/nominations');
    if (!nominationsResponse.ok) {
      console.log('❌ Failed to fetch nominations');
      return;
    }
    
    const nominations = await nominationsResponse.json();
    const approvedNominations = nominations.filter(n => n.status === 'approved');
    
    console.log(`📊 Found ${approvedNominations.length} approved nominations`);
    
    if (approvedNominations.length === 0) {
      console.log('⚠️  No approved nominations found');
      return;
    }
    
    // Test first 5 approved nominations
    const testNominations = approvedNominations.slice(0, 5);
    
    for (let i = 0; i < testNominations.length; i++) {
      const nomination = testNominations[i];
      const slug = nomination.liveUrl.replace('/nominee/', '');
      
      console.log(`\\n${i + 2}️⃣ Testing: ${nomination.nominee.name}`);
      console.log(`   Slug: ${slug}`);
      console.log(`   Live URL: ${nomination.liveUrl}`);
      
      // Test API endpoint
      try {
        const apiResponse = await fetch(`http://localhost:3000/api/nominee/${slug}`);
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log('   ✅ API endpoint working');
          console.log(`   API returns: ${apiData.nominee.name}`);
        } else {
          console.log(`   ❌ API endpoint failed (${apiResponse.status})`);
          const errorText = await apiResponse.text();
          console.log(`   Error: ${errorText.substring(0, 100)}...`);
          continue;
        }
      } catch (error) {
        console.log(`   ❌ API endpoint error: ${error.message}`);
        continue;
      }
      
      // Test page load
      try {
        const pageResponse = await fetch(`http://localhost:3000/nominee/${slug}`);
        if (pageResponse.ok) {
          console.log('   ✅ Page loads successfully');
          
          // Check if page contains nominee name
          const pageContent = await pageResponse.text();
          if (pageContent.includes(nomination.nominee.name)) {
            console.log('   ✅ Page contains nominee name');
          } else {
            console.log('   ⚠️  Page missing nominee name');
          }
        } else {
          console.log(`   ❌ Page failed to load (${pageResponse.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Page load error: ${error.message}`);
      }
    }
    
    console.log('\\n🎉 Live nominee pages test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLiveNomineePages();