#!/usr/bin/env node

/**
 * Check raw database data for LinkedIn URLs
 */

require('dotenv').config();

async function checkRawDatabase() {
  console.log('🔍 Checking Raw Database Data\n');
  
  try {
    // Create a simple API endpoint to get raw data
    const response = await fetch('http://localhost:3000/api/stats');
    
    if (!response.ok) {
      console.log('❌ Server not responding');
      return;
    }
    
    console.log('✅ Server is running\n');
    
    // Let's check the nominations API with a different approach
    const nominationsResponse = await fetch('http://localhost:3000/api/nominations');
    
    if (nominationsResponse.ok) {
      const nominations = await nominationsResponse.json();
      console.log(`📊 Found ${nominations.length} nominations\n`);
      
      // Check first few for LinkedIn data
      const sampleSize = Math.min(3, nominations.length);
      console.log(`🔍 Checking first ${sampleSize} nominations:\n`);
      
      for (let i = 0; i < sampleSize; i++) {
        const nomination = nominations[i];
        console.log(`${i + 1}. Nomination ID: ${nomination.id}`);
        console.log(`   Nominee Name: ${nomination.nominee?.name || 'N/A'}`);
        console.log(`   Category: ${nomination.category}`);
        console.log(`   Type: ${nomination.type}`);
        console.log(`   LinkedIn: ${nomination.nominee?.linkedin || '❌ MISSING'}`);
        console.log(`   Status: ${nomination.status}`);
        console.log('   Raw nominee object:', JSON.stringify(nomination.nominee, null, 2));
        console.log('');
      }
      
      // Count LinkedIn URLs
      const withLinkedIn = nominations.filter(n => n.nominee?.linkedin && n.nominee.linkedin.trim() !== '');
      console.log(`📈 LinkedIn Statistics:`);
      console.log(`   ✅ With LinkedIn: ${withLinkedIn.length}`);
      console.log(`   ❌ Without LinkedIn: ${nominations.length - withLinkedIn.length}`);
      
      if (withLinkedIn.length > 0) {
        console.log('\n✅ Nominations WITH LinkedIn URLs:');
        withLinkedIn.slice(0, 3).forEach((nom, i) => {
          console.log(`   ${i + 1}. ${nom.nominee.name}: ${nom.nominee.linkedin}`);
        });
      }
      
    } else {
      console.log('❌ Could not fetch nominations');
      console.log('Response status:', nominationsResponse.status);
      const errorText = await nominationsResponse.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkRawDatabase().catch(console.error);