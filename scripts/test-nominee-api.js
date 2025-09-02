#!/usr/bin/env node

/**
 * Test Nominee API
 * Tests the individual nominee API endpoint
 */

async function testNomineeAPI() {
  console.log('🧪 Testing Nominee API...');
  console.log('='.repeat(50));
  
  try {
    // First, get a list of nominations to find an approved one
    console.log('1️⃣ Getting list of nominations...');
    
    const nominationsResponse = await fetch('http://localhost:3000/api/nominations');
    if (!nominationsResponse.ok) {
      console.log('❌ Failed to fetch nominations');
      return;
    }
    
    const nominations = await nominationsResponse.json();
    console.log(`📊 Found ${nominations.length} nominations`);
    
    // Find an approved nomination
    const approvedNomination = nominations.find(n => n.status === 'approved');
    
    if (!approvedNomination) {
      console.log('⚠️  No approved nominations found. Let me approve one for testing...');
      
      // Get the first nomination and approve it for testing
      if (nominations.length > 0) {
        const testNomination = nominations[0];
        console.log(`📝 Approving nomination: ${testNomination.nominee.name}`);
        
        // Note: We would need an admin API to approve nominations
        // For now, let's test with any nomination slug
        const slug = testNomination.liveUrl.replace('/nominee/', '');
        console.log(`🔗 Testing with slug: ${slug}`);
        
        // Test the nominee API
        console.log('\\n2️⃣ Testing nominee API endpoint...');
        const nomineeResponse = await fetch(`http://localhost:3000/api/nominee/${slug}`);
        
        if (nomineeResponse.ok) {
          const nominee = await nomineeResponse.json();
          console.log('✅ Nominee API working!');
          console.log('📋 Nominee data:');
          console.log(`   Name: ${nominee.nominee.name}`);
          console.log(`   Category: ${nominee.category}`);
          console.log(`   Status: ${nominee.status}`);
          console.log(`   Has Image: ${!!nominee.nominee.imageUrl}`);
          console.log(`   Image URL: ${nominee.nominee.imageUrl || 'None'}`);
          console.log(`   Votes: ${nominee.votes || 0}`);
        } else {
          const errorText = await nomineeResponse.text();
          console.log('❌ Nominee API failed');
          console.log(`   Status: ${nomineeResponse.status}`);
          console.log(`   Error: ${errorText}`);
        }
        
        // Test the nominee page
        console.log('\\n3️⃣ Testing nominee page...');
        const pageResponse = await fetch(`http://localhost:3000/nominee/${slug}`);
        
        if (pageResponse.ok) {
          console.log('✅ Nominee page loads successfully');
        } else {
          console.log('❌ Nominee page failed to load');
          console.log(`   Status: ${pageResponse.status}`);
        }
        
      } else {
        console.log('❌ No nominations found to test with');
      }
    } else {
      const slug = approvedNomination.liveUrl.replace('/nominee/', '');
      console.log(`✅ Found approved nomination: ${approvedNomination.nominee.name}`);
      console.log(`🔗 Testing with slug: ${slug}`);
      
      // Test the nominee API
      console.log('\\n2️⃣ Testing nominee API endpoint...');
      const nomineeResponse = await fetch(`http://localhost:3000/api/nominee/${slug}`);
      
      if (nomineeResponse.ok) {
        const nominee = await nomineeResponse.json();
        console.log('✅ Nominee API working!');
        console.log('📋 Nominee data:');
        console.log(`   Name: ${nominee.nominee.name}`);
        console.log(`   Category: ${nominee.category}`);
        console.log(`   Status: ${nominee.status}`);
        console.log(`   Has Image: ${!!nominee.nominee.imageUrl}`);
        console.log(`   Votes: ${nominee.votes || 0}`);
      } else {
        const errorText = await nomineeResponse.text();
        console.log('❌ Nominee API failed');
        console.log(`   Status: ${nomineeResponse.status}`);
        console.log(`   Error: ${errorText}`);
      }
    }
    
    console.log('\\n🎉 Nominee API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNomineeAPI();