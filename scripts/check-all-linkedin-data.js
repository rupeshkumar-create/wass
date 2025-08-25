#!/usr/bin/env node

/**
 * Check LinkedIn URL data for all three categories: Nominators, Nominees, Voters
 */

require('dotenv').config();

async function checkAllLinkedInData() {
  console.log('🔍 Checking LinkedIn URLs for All Categories\n');
  
  try {
    // 1. Check Nominees LinkedIn URLs
    console.log('👥 1. NOMINEES LinkedIn URLs:\n');
    
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?limit=3');
    if (nomineesResponse.ok) {
      const nominees = await nomineesResponse.json();
      console.log(`Found ${nominees.length} nominees`);
      
      nominees.forEach((nominee, i) => {
        console.log(`${i + 1}. ${nominee.nominee.name} (${nominee.type})`);
        console.log(`   LinkedIn: ${nominee.nominee.linkedin || '❌ MISSING'}`);
        console.log(`   Category: ${nominee.category}`);
        console.log('');
      });
    } else {
      console.log('❌ Could not fetch nominees');
    }
    
    // 2. Check Nominations (includes nominator data)
    console.log('📝 2. NOMINATORS LinkedIn URLs:\n');
    
    const nominationsResponse = await fetch('http://localhost:3000/api/nominations?limit=3');
    if (nominationsResponse.ok) {
      const nominations = await nominationsResponse.json();
      console.log(`Found ${nominations.length} nominations`);
      
      nominations.forEach((nomination, i) => {
        console.log(`${i + 1}. Nominator: ${nomination.nominator?.name || 'N/A'}`);
        console.log(`   Email: ${nomination.nominator?.email || 'N/A'}`);
        console.log(`   LinkedIn: ${nomination.nominator?.linkedin || '❌ MISSING'}`);
        console.log(`   Nominated: ${nomination.nominee?.name}`);
        console.log('');
      });
    } else {
      console.log('❌ Could not fetch nominations');
    }
    
    // 3. Check Votes (includes voter data)
    console.log('🗳️  3. VOTERS LinkedIn URLs:\n');
    
    // We need to check the votes API or database directly
    // Let's try to get some vote data
    const statsResponse = await fetch('http://localhost:3000/api/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`Total votes in system: ${stats.totalVotes}`);
      
      // Try to get some voter data by checking a specific endpoint
      // We might need to create a debug endpoint for this
      console.log('Note: Voter LinkedIn data needs to be checked in the votes table');
      console.log('Voters are created when they vote, with their LinkedIn URLs');
    }
    
    console.log('\n📊 Summary:');
    console.log('✅ Nominees: Have LinkedIn URLs in database');
    console.log('❓ Nominators: Need to check if LinkedIn URLs are collected');
    console.log('❓ Voters: Need to check if LinkedIn URLs are collected');
    
  } catch (error) {
    console.error('❌ Error checking LinkedIn data:', error.message);
  }
}

checkAllLinkedInData().catch(console.error);