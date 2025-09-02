#!/usr/bin/env node

const fetch = require('node-fetch');

async function testIndividualPages() {
  console.log('🔍 Testing Individual Nominee Pages Fix...\n');
  
  try {
    // First get all nominees
    console.log('📋 Fetching all nominees...');
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
    const nomineesResult = await nomineesResponse.json();
    
    if (!nomineesResult.success) {
      throw new Error('Failed to fetch nominees: ' + nomineesResult.error);
    }
    
    const nominees = nomineesResult.data;
    console.log(`✅ Found ${nominees.length} nominees\n`);
    
    // Test first 5 nominees
    const testNominees = nominees.slice(0, 5);
    
    for (const nominee of testNominees) {
      console.log(`🧪 Testing: ${nominee.nominee.name} (${nominee.type})`);
      console.log(`   ID: ${nominee.id}`);
      console.log(`   Category: ${nominee.category}`);
      
      // Test the individual page
      const pageUrl = `http://localhost:3000/nominee/${nominee.id}`;
      console.log(`   URL: ${pageUrl}`);
      
      try {
        const pageResponse = await fetch(pageUrl);
        console.log(`   Status: ${pageResponse.status} ${pageResponse.statusText}`);
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Check if the page contains the nominee's name
          const hasName = html.includes(nominee.nominee.name);
          const hasVoteButton = html.includes('Cast Your Vote') || html.includes('Vote for');
          const hasCategory = html.includes(nominee.category);
          
          console.log(`   ✅ Contains name: ${hasName}`);
          console.log(`   ✅ Contains vote button: ${hasVoteButton}`);
          console.log(`   ✅ Contains category: ${hasCategory}`);
          
          if (hasName && hasVoteButton && hasCategory) {
            console.log(`   🎉 Page is working correctly!`);
          } else {
            console.log(`   ⚠️  Page may have issues`);
          }
        } else {
          console.log(`   ❌ Page failed to load`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing page: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('🎯 Testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testIndividualPages();