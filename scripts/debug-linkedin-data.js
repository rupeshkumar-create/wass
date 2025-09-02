#!/usr/bin/env node

/**
 * Debug script to check if LinkedIn URLs are present in the actual data
 */

require('dotenv').config();

async function debugLinkedInData() {
  console.log('🔍 Debugging LinkedIn URL Data\n');
  
  try {
    // Test the API to get some real nomination data
    const response = await fetch('http://localhost:3000/api/nominees');
    
    if (!response.ok) {
      console.log('❌ Could not fetch nominees data');
      console.log('Make sure the development server is running: npm run dev');
      return;
    }
    
    const nominees = await response.json();
    console.log(`📊 Found ${nominees.length} nominees\n`);
    
    // Check first few nominees for LinkedIn URLs
    const sampleSize = Math.min(5, nominees.length);
    console.log(`🔍 Checking first ${sampleSize} nominees for LinkedIn URLs:\n`);
    
    for (let i = 0; i < sampleSize; i++) {
      const nominee = nominees[i];
      console.log(`${i + 1}. ${nominee.name}`);
      console.log(`   Type: ${nominee.type}`);
      console.log(`   Category: ${nominee.category}`);
      console.log(`   LinkedIn: ${nominee.linkedin || '❌ MISSING'}`);
      console.log(`   Status: ${nominee.status}`);
      console.log('');
    }
    
    // Count how many have LinkedIn URLs
    const withLinkedIn = nominees.filter(n => n.linkedin && n.linkedin.trim() !== '');
    const withoutLinkedIn = nominees.filter(n => !n.linkedin || n.linkedin.trim() === '');
    
    console.log('📈 LinkedIn URL Statistics:');
    console.log(`   ✅ With LinkedIn: ${withLinkedIn.length}`);
    console.log(`   ❌ Without LinkedIn: ${withoutLinkedIn.length}`);
    console.log(`   📊 Percentage with LinkedIn: ${Math.round((withLinkedIn.length / nominees.length) * 100)}%\n`);
    
    if (withLinkedIn.length > 0) {
      console.log('✅ Sample nominees WITH LinkedIn URLs:');
      withLinkedIn.slice(0, 3).forEach((nominee, i) => {
        console.log(`   ${i + 1}. ${nominee.name}: ${nominee.linkedin}`);
      });
      console.log('');
    }
    
    if (withoutLinkedIn.length > 0) {
      console.log('❌ Sample nominees WITHOUT LinkedIn URLs:');
      withoutLinkedIn.slice(0, 3).forEach((nominee, i) => {
        console.log(`   ${i + 1}. ${nominee.name}: No LinkedIn URL`);
      });
      console.log('');
    }
    
    // Test the mappers with real data
    if (withLinkedIn.length > 0) {
      console.log('🧪 Testing mappers with real data:\n');
      
      const testNominee = withLinkedIn[0];
      console.log(`Testing with: ${testNominee.name}`);
      console.log(`LinkedIn URL: ${testNominee.linkedin}`);
      
      // Simulate the mapper function
      const mappedData = {
        properties: {
          firstname: testNominee.name.split(' ')[0] || '',
          lastname: testNominee.name.split(' ').slice(1).join(' ') || '',
          linkedin_url: testNominee.linkedin || undefined,
          wsa_linkedin_url: testNominee.linkedin || undefined,
          website: testNominee.linkedin || undefined,
        }
      };
      
      console.log('\nMapped HubSpot data:');
      console.log(JSON.stringify(mappedData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error debugging LinkedIn data:', error.message);
  }
}

// Run the debug
debugLinkedInData().catch(console.error);