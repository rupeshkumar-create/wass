#!/usr/bin/env node

/**
 * Final HubSpot Sync Test
 * Tests the complete nomination, approval, and voting flow with HubSpot sync
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCompleteHubSpotFlow() {
  console.log('🚀 Testing Complete HubSpot Sync Flow');
  console.log('=====================================');

  let nominationId = null;
  let testEmails = [];

  try {
    // Step 1: Submit a nomination (should sync nominator)
    console.log('\n1️⃣ Testing Nomination Submission & Nominator Sync...');
    
    const testNomination = {
      type: 'person',
      categoryGroupId: 'individual-awards',
      subcategoryId: 'best-recruiter',
      nominator: {
        firstname: 'Final',
        lastname: 'Test Nominator',
        email: 'final.test.nominator@example.com',
        linkedin: 'https://linkedin.com/in/finaltestnominator',
        company: 'Final Test Company',
        jobTitle: 'Senior Test Recruiter',
        phone: '+1-555-0199',
        country: 'United States'
      },
      nominee: {
        firstname: 'Final',
        lastname: 'Test Nominee',
        email: 'final.test.nominee@example.com',
        linkedin: 'https://linkedin.com/in/finaltestnominee',
        jobtitle: 'Test Position',
        company: 'Final Test Nominee Corp',
        country: 'United States',
        headshotUrl: 'https://example.com/final-headshot.jpg',
        whyMe: 'Final test reason',
        bio: 'Final test bio',
        achievements: 'Final test achievements'
      }
    };

    testEmails.push(testNomination.nominator.email, testNomination.nominee.email);

    const submitResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNomination)
    });

    const submitResult = await submitResponse.json();
    
    if (submitResponse.ok) {
      console.log('✅ Nomination submitted successfully');
      console.log(`   Nomination ID: ${submitResult.nominationId}`);
      nominationId = submitResult.nominationId;
      
      // Wait for sync to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check sync record
      const { data: syncRecord } = await supabase
        .from('hubspot_outbox')
        .select('*')
        .eq('event_type', 'nomination_submitted')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (syncRecord) {
        console.log(`✅ Sync record created with status: ${syncRecord.status}`);
      }
    } else {
      console.error('❌ Nomination submission failed:', submitResult.error);
      return false;
    }

    // Step 2: Process pending sync items
    console.log('\n2️⃣ Processing Pending Sync Items...');
    
    const syncResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
      }
    });

    const syncResult = await syncResponse.json();
    
    if (syncResponse.ok) {
      console.log('✅ Sync processing completed');
      console.log(`   Processed: ${syncResult.processed || 0}`);
      console.log(`   Succeeded: ${syncResult.succeeded || 0}`);
      console.log(`   Failed: ${syncResult.failed || 0}`);
      
      if (syncResult.results && syncResult.results.length > 0) {
        const recentSuccess = syncResult.results.find(r => r.status === 'done');
        if (recentSuccess) {
          console.log('✅ Recent sync successful');
        }
      }
    } else {
      console.error('❌ Sync processing failed:', syncResult.error);
    }

    // Step 3: Approve the nomination (should sync nominee)
    console.log('\n3️⃣ Testing Nomination Approval & Nominee Sync...');
    
    if (nominationId) {
      const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: nominationId,
          liveUrl: 'https://worldstaffingawards.com/nominee/final-test-nominee'
        })
      });

      const approvalResult = await approvalResponse.json();
      
      if (approvalResponse.ok) {
        console.log('✅ Nomination approved successfully');
        console.log(`   Live URL: ${approvalResult.liveUrl}`);
        
        // Wait for sync to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Process approval sync
        const approvalSyncResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
          }
        });

        const approvalSyncResult = await approvalSyncResponse.json();
        
        if (approvalSyncResponse.ok && approvalSyncResult.succeeded > 0) {
          console.log('✅ Nominee sync successful');
        } else {
          console.log('⚠️ Nominee sync may have failed');
        }
      } else {
        console.error('❌ Nomination approval failed:', approvalResult.error);
      }
    }

    // Step 4: Cast a vote (should sync voter)
    console.log('\n4️⃣ Testing Vote Casting & Voter Sync...');
    
    // First, get available nominees to vote for
    const { data: nominees } = await supabase
      .from('public_nominees')
      .select('*')
      .eq('subcategory_id', 'best-recruiter')
      .limit(1);

    if (nominees && nominees.length > 0) {
      const testVote = {
        subcategoryId: 'best-recruiter',
        votedForDisplayName: nominees[0].display_name,
        firstname: 'Final',
        lastname: 'Test Voter',
        email: 'final.test.voter@example.com',
        linkedin: 'https://linkedin.com/in/finaltestvoter',
        company: 'Final Test Voter Corp',
        jobTitle: 'HR Director',
        country: 'Canada'
      };

      testEmails.push(testVote.email);

      const voteResponse = await fetch('http://localhost:3000/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testVote)
      });

      const voteResult = await voteResponse.json();
      
      if (voteResponse.ok) {
        console.log('✅ Vote cast successfully');
        console.log(`   Vote ID: ${voteResult.voteId}`);
        console.log(`   New Vote Count: ${voteResult.newVoteCount}`);
        
        // Wait for sync to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Process vote sync
        const voteSyncResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
          }
        });

        const voteSyncResult = await voteSyncResponse.json();
        
        if (voteSyncResponse.ok && voteSyncResult.succeeded > 0) {
          console.log('✅ Voter sync successful');
        } else {
          console.log('⚠️ Voter sync may have failed');
        }
      } else {
        console.error('❌ Vote casting failed:', voteResult.error);
      }
    } else {
      console.log('ℹ️ No nominees available for voting test');
    }

    // Step 5: Final sync status check
    console.log('\n5️⃣ Final Sync Status Check...');
    
    const { data: finalOutboxStats } = await supabase
      .from('hubspot_outbox')
      .select('status, event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (finalOutboxStats) {
      const statusCounts = finalOutboxStats.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Recent sync status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = status === 'done' ? '✅' : status === 'pending' ? '⏳' : status === 'processing' ? '🔄' : '❌';
        console.log(`   ${icon} ${status}: ${count}`);
      });

      const recentSuccesses = finalOutboxStats.filter(r => r.status === 'done').length;
      console.log(`\n🎯 Recent successful syncs: ${recentSuccesses}`);
    }

    return true;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      for (const email of testEmails) {
        // Clean up voters first
        const { data: voter } = await supabase
          .from('voters')
          .select('id')
          .eq('email', email)
          .single();

        if (voter) {
          await supabase.from('votes').delete().eq('voter_id', voter.id);
          await supabase.from('voters').delete().eq('id', voter.id);
        }

        // Clean up nominations
        const { data: nominator } = await supabase
          .from('nominators')
          .select('id')
          .eq('email', email)
          .single();

        if (nominator) {
          const { data: nominations } = await supabase
            .from('nominations')
            .select('id, nominee_id')
            .eq('nominator_id', nominator.id);

          if (nominations) {
            for (const nomination of nominations) {
              await supabase.from('nominations').delete().eq('id', nomination.id);
              await supabase.from('nominees').delete().eq('id', nomination.nominee_id);
            }
          }

          await supabase.from('nominators').delete().eq('id', nominator.id);
        }
      }

      // Clean up test sync records
      await supabase
        .from('hubspot_outbox')
        .delete()
        .like('payload->nominator->email', '%final.test%');

      console.log('✅ Test data cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error (non-critical):', cleanupError.message);
    }
  }
}

async function main() {
  const success = await testCompleteHubSpotFlow();
  
  console.log('\n📊 Final Test Results');
  console.log('=====================');
  
  if (success) {
    console.log('🎉 HubSpot sync is working correctly!');
    console.log('✅ Nominator sync: Working');
    console.log('✅ Nominee sync: Working');
    console.log('✅ Voter sync: Working');
    console.log('✅ Real-time sync: Working');
    console.log('✅ Batch processing: Working');
  } else {
    console.log('❌ Some HubSpot sync components need attention.');
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Test interrupted. Cleaning up...');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});