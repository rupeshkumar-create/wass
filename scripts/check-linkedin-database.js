#!/usr/bin/env node

/**
 * Check LinkedIn URLs directly in the database
 */

require('dotenv').config();

async function checkLinkedInDatabase() {
  console.log('🔍 Checking LinkedIn URLs in Database\n');
  
  try {
    // Check the nominations table directly
    const response = await fetch('http://localhost:3000/api/debug/nominee');
    
    if (!response.ok) {
      console.log('❌ Could not fetch debug data');
      console.log('Response status:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Database Debug Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

// Also create a simple API test
async function testDirectAPI() {
  console.log('\n🧪 Testing Direct API Calls\n');
  
  try {
    // Test stats API
    const statsResponse = await fetch('http://localhost:3000/api/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('📊 Stats API Response:');
      console.log(`Total Nominations: ${stats.totalNominations}`);
      console.log(`Total Votes: ${stats.totalVotes}`);
    }
    
    // Test a specific nominee API
    const nomineeResponse = await fetch('http://localhost:3000/api/nominee/test-slug');
    console.log('\n🔍 Single Nominee API Status:', nomineeResponse.status);
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Run both checks
async function runChecks() {
  await checkLinkedInDatabase();
  await testDirectAPI();
}

runChecks().catch(console.error);