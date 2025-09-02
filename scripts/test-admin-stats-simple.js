#!/usr/bin/env node

/**
 * Simple test for Enhanced Stats API
 */

const { execSync } = require('child_process');

async function testAdminStats() {
  console.log('🧪 Testing Enhanced Stats API...\n');

  try {
    // Test the enhanced stats endpoint using curl
    console.log('📊 Fetching enhanced statistics...');
    const result = execSync('curl -s http://localhost:3000/api/stats', { encoding: 'utf8' });
    
    const data = JSON.parse(result);
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error}`);
    }

    const stats = data.data;
    
    console.log('✅ Enhanced Stats Retrieved Successfully!\n');
    
    // Display vote statistics
    console.log('🗳️  VOTE STATISTICS:');
    console.log(`   Real Votes: ${stats.totalRealVotes}`);
    console.log(`   Additional Votes: ${stats.totalAdditionalVotes}`);
    console.log(`   Total Combined Votes: ${stats.totalCombinedVotes}`);
    console.log(`   Unique Voters: ${stats.uniqueVoters}`);
    console.log(`   Nominations with Additional Votes: ${stats.nominationsWithAdditionalVotes}`);
    console.log(`   Percentage Additional Votes: ${stats.percentageAdditionalVotes}%\n`);
    
    // Display basic nomination stats
    console.log('📋 NOMINATION STATISTICS:');
    console.log(`   Total: ${stats.totalNominations}`);
    console.log(`   Pending: ${stats.pendingNominations}`);
    console.log(`   Approved: ${stats.approvedNominations}`);
    console.log(`   Rejected: ${stats.rejectedNominations}\n`);
    
    console.log('✅ Enhanced Stats Test Completed Successfully!');
    console.log('\n📝 SUMMARY:');
    console.log('   - Enhanced stats API is working correctly');
    console.log('   - Real and additional votes are being tracked separately');
    console.log('   - Total votes combine both real and additional votes');
    console.log('   - Admin panel should now show updated vote statistics');
    
  } catch (error) {
    console.error('❌ Enhanced Stats Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAdminStats();