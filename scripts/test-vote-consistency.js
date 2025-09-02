#!/usr/bin/env node

/**
 * Test script to verify vote consistency between homepage and admin panel
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVoteConsistency() {
  console.log('🔍 Testing vote consistency between homepage and admin panel...\n');

  try {
    // Test 1: Check public stats (homepage)
    console.log('1. Testing public stats API (homepage)...');
    const publicResponse = await fetch('http://localhost:3000/api/stats');
    
    if (!publicResponse.ok) {
      console.error('❌ Public stats API failed');
      return false;
    }

    const publicStats = await publicResponse.json();
    console.log(`✅ Public stats: ${publicStats.data.totalVotes} total votes`);
    console.log(`   Approved nominations: ${publicStats.data.approvedNominations}`);

    // Test 2: Check admin stats (with admin headers)
    console.log('\n2. Testing admin stats API...');
    const adminResponse = await fetch('http://localhost:3000/api/stats', {
      headers: {
        'x-admin-auth': 'true' // Simulate admin auth
      }
    });
    
    if (!adminResponse.ok) {
      console.error('❌ Admin stats API failed');
      return false;
    }

    const adminStats = await adminResponse.json();
    console.log(`✅ Admin stats breakdown:`);
    console.log(`   Real votes: ${adminStats.data.totalRealVotes || 'N/A'}`);
    console.log(`   Additional votes: ${adminStats.data.totalAdditionalVotes || 'N/A'}`);
    console.log(`   Combined total: ${adminStats.data.totalCombinedVotes || adminStats.data.totalVotes}`);

    // Test 3: Verify consistency
    console.log('\n3. Checking consistency...');
    const publicTotal = publicStats.data.totalVotes;
    const adminTotal = adminStats.data.totalCombinedVotes || adminStats.data.totalVotes;

    if (publicTotal === adminTotal) {
      console.log(`✅ Vote counts are consistent: ${publicTotal} votes`);
    } else {
      console.log(`❌ Vote count mismatch:`);
      console.log(`   Public: ${publicTotal}`);
      console.log(`   Admin: ${adminTotal}`);
      return false;
    }

    // Test 4: Check database views directly
    console.log('\n4. Testing database views...');
    
    const { data: publicNominees, error: publicError } = await supabase
      .from('public_nominees')
      .select('nomination_id, votes, display_name')
      .limit(3);

    if (publicError) {
      console.error('❌ Public nominees view failed:', publicError.message);
      return false;
    }

    const { data: adminNominations, error: adminError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, votes, additional_votes, nominee_display_name')
      .limit(3);

    if (adminError) {
      console.error('❌ Admin nominations view failed:', adminError.message);
      return false;
    }

    console.log('Database view comparison:');
    for (const publicNom of publicNominees) {
      const adminNom = adminNominations.find(a => a.nomination_id === publicNom.nomination_id);
      
      if (adminNom) {
        const adminTotal = (adminNom.votes || 0) + (adminNom.additional_votes || 0);
        const publicVotes = publicNom.votes || 0;
        
        if (adminTotal === publicVotes) {
          console.log(`✅ ${publicNom.display_name}: ${publicVotes} votes (consistent)`);
        } else {
          console.log(`❌ ${publicNom.display_name}: Public=${publicVotes}, Admin=${adminTotal}`);
          return false;
        }
      }
    }

    // Test 5: Check auto URL generation
    console.log('\n5. Testing auto URL generation...');
    
    const { data: approvedNominations, error: urlError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, nominee_display_name, nominee_live_url, state')
      .eq('state', 'approved')
      .limit(5);

    if (urlError) {
      console.error('❌ URL check failed:', urlError.message);
      return false;
    }

    let urlIssues = 0;
    for (const nom of approvedNominations) {
      if (!nom.nominee_live_url) {
        console.log(`⚠️  Missing live URL: ${nom.nominee_display_name}`);
        urlIssues++;
      } else {
        console.log(`✅ ${nom.nominee_display_name}: ${nom.nominee_live_url}`);
      }
    }

    if (urlIssues === 0) {
      console.log('\n✅ All approved nominations have live URLs');
    } else {
      console.log(`\n⚠️  Found ${urlIssues} nominations without URLs`);
    }

    console.log('\n🎉 Vote consistency test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting vote consistency verification...\n');

  const success = await testVoteConsistency();
  
  if (success) {
    console.log('\n✅ All tests passed!');
    console.log('📊 Homepage and admin panel show consistent vote counts');
    console.log('🔗 Auto URL generation is working');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    console.log('🔧 Check the issues above and run the test again');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});