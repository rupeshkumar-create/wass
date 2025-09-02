#!/usr/bin/env node

/**
 * Test Enhanced Stats API
 * Tests the new vote statistics functionality in the admin panel
 */

// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testEnhancedStats() {
  console.log('🧪 Testing Enhanced Stats API...\n');

  try {
    // Test the enhanced stats endpoint
    console.log('📊 Fetching enhanced statistics...');
    const response = await fetch(`${BASE_URL}/api/stats`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API Error: ${result.error}`);
    }

    const stats = result.data;
    
    console.log('✅ Enhanced Stats Retrieved Successfully!\n');
    
    // Display basic nomination stats
    console.log('📋 NOMINATION STATISTICS:');
    console.log(`   Total Nominations: ${stats.totalNominations}`);
    console.log(`   Pending: ${stats.pendingNominations}`);
    console.log(`   Approved: ${stats.approvedNominations}`);
    console.log(`   Rejected: ${stats.rejectedNominations}\n`);
    
    // Display vote statistics
    console.log('🗳️  VOTE STATISTICS:');
    console.log(`   Real Votes: ${stats.totalRealVotes}`);
    console.log(`   Additional Votes: ${stats.totalAdditionalVotes}`);
    console.log(`   Total Combined Votes: ${stats.totalCombinedVotes}`);
    console.log(`   Unique Voters: ${stats.uniqueVoters}\n`);
    
    // Display calculated metrics
    console.log('📈 CALCULATED METRICS:');
    console.log(`   Average Votes per Nominee: ${stats.averageVotesPerNominee}`);
    console.log(`   Average Real Votes per Nominee: ${stats.averageRealVotesPerNominee}`);
    console.log(`   Nominations with Additional Votes: ${stats.nominationsWithAdditionalVotes}`);
    console.log(`   Percentage Additional Votes: ${stats.percentageAdditionalVotes}%\n`);
    
    // Display category breakdown
    console.log('📊 CATEGORY BREAKDOWN:');
    const categories = Object.entries(stats.byCategory);
    if (categories.length > 0) {
      categories.forEach(([category, data]) => {
        console.log(`   ${category}:`);
        console.log(`     Nominees: ${data.nominees}`);
        console.log(`     Real Votes: ${data.realVotes}`);
        console.log(`     Additional Votes: ${data.additionalVotes}`);
        console.log(`     Total Votes: ${data.totalVotes}`);
      });
    } else {
      console.log('   No categories found');
    }
    
    console.log('\n✅ Enhanced Stats Test Completed Successfully!');
    
    // Test real-time updates by making multiple calls
    console.log('\n🔄 Testing Real-time Updates...');
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updateResponse = await fetch(`${BASE_URL}/api/stats`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        if (updateResult.success) {
          console.log(`   Update ${i}: Total Votes = ${updateResult.data.totalCombinedVotes} (Real: ${updateResult.data.totalRealVotes}, Additional: ${updateResult.data.totalAdditionalVotes})`);
        }
      }
    }
    
    console.log('\n✅ Real-time Updates Test Completed!');
    
  } catch (error) {
    console.error('❌ Enhanced Stats Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedStats();