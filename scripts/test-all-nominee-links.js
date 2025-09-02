#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testAllNomineeLinks() {
  console.log('🔍 Testing All Nominee Links from Directory to Individual Pages...\n');
  
  try {
    // Fetch all nominees from API
    console.log('📋 Fetching all nominees from API...');
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
    const nomineesResult = await nomineesResponse.json();
    
    if (!nomineesResult.success) {
      throw new Error('Failed to fetch nominees: ' + nomineesResult.error);
    }
    
    const nominees = nomineesResult.data;
    console.log(`✅ Found ${nominees.length} nominees\n`);
    
    // Test each nominee's individual page
    let successCount = 0;
    let failCount = 0;
    
    for (const nominee of nominees) {
      const nomineeUrl = `http://localhost:3000/nominee/${nominee.id}`;
      console.log(`🧪 Testing: ${nominee.nominee.name} (${nominee.type})`);
      console.log(`   URL: ${nomineeUrl}`);
      
      try {
        const pageResponse = await fetch(nomineeUrl);
        console.log(`   Status: ${pageResponse.status} ${pageResponse.statusText}`);
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Check if the page contains the nominee's name
          const hasName = html.includes(nominee.nominee.name);
          const hasVoteButton = html.includes('Cast Your Vote') || html.includes('Vote for');
          const hasCategory = html.includes(nominee.category);
          
          if (hasName && hasVoteButton && hasCategory) {
            console.log(`   ✅ Page working correctly!`);
            successCount++;
          } else {
            console.log(`   ⚠️  Page has issues:`);
            console.log(`      - Has name: ${hasName}`);
            console.log(`      - Has vote button: ${hasVoteButton}`);
            console.log(`      - Has category: ${hasCategory}`);
            failCount++;
          }
        } else {
          console.log(`   ❌ Page failed to load`);
          failCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error testing page: ${error.message}`);
        failCount++;
      }
      
      console.log('');
    }
    
    console.log('📊 SUMMARY:');
    console.log(`✅ Working pages: ${successCount}`);
    console.log(`❌ Failed pages: ${failCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / nominees.length) * 100)}%`);
    
    if (failCount === 0) {
      console.log('\n🎉 ALL NOMINEE PAGES ARE WORKING CORRECTLY!');
    } else {
      console.log(`\n⚠️  ${failCount} pages need attention.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAllNomineeLinks();