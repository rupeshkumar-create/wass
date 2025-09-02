#!/usr/bin/env node

/**
 * Test the public_nominees view directly
 */

require('dotenv').config();

async function testPublicNomineesView() {
  console.log('🔍 Testing public_nominees View\n');
  
  try {
    // Test the nominees API (which uses public_nominees view)
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?limit=3');
    
    if (!nomineesResponse.ok) {
      console.log('❌ Could not fetch from nominees API');
      console.log('Status:', nomineesResponse.status);
      return;
    }
    
    const nominees = await nomineesResponse.json();
    console.log(`📊 Nominees API returned ${nominees.length} nominees\n`);
    
    // Check each nominee for LinkedIn data
    nominees.forEach((nominee, i) => {
      console.log(`${i + 1}. ${nominee.nominee?.name || 'No name'}`);
      console.log(`   ID: ${nominee.id}`);
      console.log(`   Category: ${nominee.category}`);
      console.log(`   Type: ${nominee.type}`);
      console.log(`   LinkedIn: ${nominee.nominee?.linkedin || '❌ MISSING'}`);
      console.log(`   Status: ${nominee.status}`);
      console.log(`   Votes: ${nominee.votes}`);
      console.log('   Full nominee object:', JSON.stringify(nominee.nominee, null, 2));
      console.log('');
    });
    
    // Compare with nominations API
    console.log('🔄 Comparing with nominations API...\n');
    
    const nominationsResponse = await fetch('http://localhost:3000/api/nominations?limit=3');
    
    if (nominationsResponse.ok) {
      const nominations = await nominationsResponse.json();
      console.log(`📊 Nominations API returned ${nominations.length} nominations\n`);
      
      nominations.forEach((nomination, i) => {
        console.log(`${i + 1}. ${nomination.nominee?.name || 'No name'}`);
        console.log(`   LinkedIn: ${nomination.nominee?.linkedin || '❌ MISSING'}`);
        console.log('');
      });
      
      // Check if IDs match
      const nomineeIds = nominees.map(n => n.id);
      const nominationIds = nominations.map(n => n.id);
      
      console.log('🔍 ID Comparison:');
      console.log('Nominee IDs:', nomineeIds);
      console.log('Nomination IDs:', nominationIds);
      
      const matchingIds = nomineeIds.filter(id => nominationIds.includes(id));
      console.log(`Matching IDs: ${matchingIds.length}/${Math.min(nominees.length, nominations.length)}`);
      
    } else {
      console.log('❌ Could not fetch nominations for comparison');
    }
    
  } catch (error) {
    console.error('❌ Error testing view:', error.message);
  }
}

testPublicNomineesView().catch(console.error);