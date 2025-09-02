#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testFrontendFixes() {
  console.log('🔍 Testing Frontend Fixes...\n');
  
  try {
    // Test 1: Check if nominees API is working
    console.log('📋 Testing nominees API...');
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
    const nomineesResult = await nomineesResponse.json();
    
    if (nomineesResult.success && nomineesResult.data.length > 0) {
      console.log(`✅ Nominees API working - ${nomineesResult.data.length} nominees found`);
      
      const testNominee = nomineesResult.data[0];
      console.log(`📝 Test nominee: ${testNominee.nominee.name} (${testNominee.type})`);
      
      // Test 2: Check individual nominee page
      console.log('\n🧪 Testing individual nominee page...');
      const pageUrl = `http://localhost:3000/nominee/${testNominee.id}`;
      const pageResponse = await fetch(pageUrl);
      
      if (pageResponse.ok) {
        console.log(`✅ Individual page loads: ${pageUrl}`);
        
        const html = await pageResponse.text();
        const hasName = html.includes(testNominee.nominee.name);
        const hasVoteButton = html.includes('Cast Your Vote');
        
        console.log(`   - Contains name: ${hasName ? '✅' : '❌'}`);
        console.log(`   - Contains vote button: ${hasVoteButton ? '✅' : '❌'}`);
      } else {
        console.log(`❌ Individual page failed: ${pageResponse.status}`);
      }
      
      // Test 3: Check vote count API
      console.log('\n🗳️  Testing vote count API...');
      const voteCountUrl = `http://localhost:3000/api/votes/count?nominationId=${testNominee.id}`;
      const voteCountResponse = await fetch(voteCountUrl);
      
      if (voteCountResponse.ok) {
        const voteCountData = await voteCountResponse.json();
        console.log(`✅ Vote count API working - ${voteCountData.total} votes`);
      } else {
        console.log(`❌ Vote count API failed: ${voteCountResponse.status}`);
      }
      
    } else {
      console.log('❌ Nominees API failed or returned no data');
    }
    
    console.log('\n🎯 Frontend fixes test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendFixes();