#!/usr/bin/env node

/**
 * Test the fixed HubSpot sync
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function testSync() {
  console.log('🔍 Testing fixed HubSpot sync...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-key': 'wsa2026-secure-cron-key'
      },
      body: JSON.stringify({ limit: 5 })
    });

    const result = await response.json();
    
    console.log('📊 Sync Results:');
    console.log(`  - Processed: ${result.processed}`);
    console.log(`  - Succeeded: ${result.succeeded}`);
    console.log(`  - Failed: ${result.failed}`);
    
    if (result.results) {
      result.results.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.event_type}`);
        console.log(`   Status: ${item.status}`);
        if (item.error) {
          console.log(`   Error: ${item.error}`);
        }
      });
    }
    
    if (result.succeeded > 0) {
      console.log('\n✅ Sync is working!');
    } else {
      console.log('\n❌ Sync still has issues');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSync();