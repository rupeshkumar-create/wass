#!/usr/bin/env node

/**
 * Test script to verify data synchronization fixes between admin panel and homepage
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDataConsistency() {
  console.log('🔍 Testing data consistency between admin panel and homepage...\n');

  try {
    // Test 1: Check admin_nominations view data
    console.log('1. Testing admin_nominations view...');
    const { data: adminNominations, error: adminError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, state, votes, additional_votes, subcategory_id, nominee_display_name')
      .eq('state', 'approved')
      .limit(5);

    if (adminError) {
      console.error('❌ Admin nominations query failed:', adminError.message);
      return false;
    }

    console.log(`✅ Found ${adminNominations.length} approved nominations in admin view`);

    // Test 2: Check public_nominees view data
    console.log('\n2. Testing public_nominees view...');
    const { data: publicNominees, error: publicError } = await supabase
      .from('public_nominees')
      .select('nomination_id, votes, subcategory_id, display_name')
      .limit(5);

    if (publicError) {
      console.error('❌ Public nominees query failed:', publicError.message);
      return false;
    }

    console.log(`✅ Found ${publicNominees.length} nominees in public view`);

    // Test 3: Compare vote counts
    console.log('\n3. Comparing vote counts between views...');
    let consistencyIssues = 0;

    for (const adminNom of adminNominations) {
      const publicNom = publicNominees.find(p => p.nomination_id === adminNom.nomination_id);
      
      if (publicNom) {
        const adminTotal = (adminNom.votes || 0) + (adminNom.additional_votes || 0);
        const publicVotes = publicNom.votes || 0;
        
        if (adminTotal !== publicVotes) {
          console.log(`⚠️  Vote mismatch for ${adminNom.nominee_display_name}:`);
          console.log(`   Admin: ${adminNom.votes} real + ${adminNom.additional_votes} additional = ${adminTotal} total`);
          console.log(`   Public: ${publicVotes} votes`);
          consistencyIssues++;
        } else {
          console.log(`✅ ${adminNom.nominee_display_name}: ${adminTotal} votes (consistent)`);
        }
      }
    }

    if (consistencyIssues === 0) {
      console.log('\n✅ All vote counts are consistent between admin and public views');
    } else {
      console.log(`\n⚠️  Found ${consistencyIssues} vote count inconsistencies`);
    }

    // Test 4: Test stats API consistency
    console.log('\n4. Testing stats API...');
    
    // Simulate public stats call
    const publicStatsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/stats`);
    
    if (publicStatsResponse.ok) {
      const publicStats = await publicStatsResponse.json();
      console.log('✅ Public stats API working');
      console.log(`   Total nominations: ${publicStats.data.totalNominations}`);
      console.log(`   Approved nominations: ${publicStats.data.approvedNominations}`);
      console.log(`   Total votes: ${publicStats.data.totalVotes}`);
    } else {
      console.log('❌ Public stats API failed');
    }

    // Test 5: Check auto-generated URLs
    console.log('\n5. Testing auto-generated URLs...');
    const { data: nominationsWithUrls, error: urlError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, nominee_display_name, nominee_live_url, state')
      .eq('state', 'approved')
      .limit(3);

    if (urlError) {
      console.error('❌ URL check failed:', urlError.message);
      return false;
    }

    let urlIssues = 0;
    for (const nom of nominationsWithUrls) {
      if (!nom.nominee_live_url) {
        console.log(`⚠️  Missing live URL for approved nomination: ${nom.nominee_display_name}`);
        urlIssues++;
      } else {
        console.log(`✅ ${nom.nominee_display_name}: ${nom.nominee_live_url}`);
      }
    }

    if (urlIssues === 0) {
      console.log('\n✅ All approved nominations have live URLs');
    } else {
      console.log(`\n⚠️  Found ${urlIssues} approved nominations without live URLs`);
    }

    // Test 6: Test top nominees calculation
    console.log('\n6. Testing top nominees calculation...');
    const { data: topNominees, error: topError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, nominee_display_name, votes, additional_votes, subcategory_id')
      .eq('state', 'approved')
      .order('votes', { ascending: false })
      .limit(3);

    if (topError) {
      console.error('❌ Top nominees query failed:', topError.message);
      return false;
    }

    console.log('Top 3 nominees by combined votes:');
    topNominees.forEach((nom, index) => {
      const totalVotes = (nom.votes || 0) + (nom.additional_votes || 0);
      console.log(`   ${index + 1}. ${nom.nominee_display_name}: ${totalVotes} votes (${nom.votes} real + ${nom.additional_votes} additional)`);
    });

    console.log('\n🎉 Data consistency test completed!');
    return consistencyIssues === 0 && urlIssues === 0;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testAutoUrlGeneration() {
  console.log('\n🔧 Testing auto URL generation...\n');

  try {
    // Find a nomination without a live URL
    const { data: nominationWithoutUrl, error } = await supabase
      .from('admin_nominations')
      .select('nomination_id, nominee_display_name, nominee_live_url, state')
      .eq('state', 'approved')
      .is('nominee_live_url', null)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Query failed:', error.message);
      return false;
    }

    if (!nominationWithoutUrl) {
      console.log('✅ All approved nominations already have live URLs');
      return true;
    }

    console.log(`Found nomination without URL: ${nominationWithoutUrl.nominee_display_name}`);

    // Test URL generation API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/generate-live-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nominationId: nominationWithoutUrl.nomination_id
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Auto-generated URL: ${result.liveUrl}`);
        return true;
      } else {
        console.log(`❌ URL generation failed: ${result.error}`);
        return false;
      }
    } else {
      console.log(`❌ URL generation API failed: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Auto URL generation test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting data synchronization tests...\n');

  const dataConsistencyPassed = await testDataConsistency();
  const urlGenerationPassed = await testAutoUrlGeneration();

  console.log('\n📊 Test Results:');
  console.log(`   Data Consistency: ${dataConsistencyPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Auto URL Generation: ${urlGenerationPassed ? '✅ PASSED' : '❌ FAILED'}`);

  if (dataConsistencyPassed && urlGenerationPassed) {
    console.log('\n🎉 All tests passed! Data sync fixes are working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});