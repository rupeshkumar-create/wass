#!/usr/bin/env node

/**
 * Debug Loops User Groups Integration
 * Tests the specific issues mentioned:
 * 1. Voter syncing with Loops but user group as "voter" not updating
 * 2. Nominees not syncing with Loops when they go live
 * 3. Nominator user group not updating to "Nominator Live" when nominee is approved
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLoopsUserGroups() {
  console.log('🔍 Testing Loops User Groups Integration...\n');

  try {
    // Test 1: Check if Loops sync is properly configured
    console.log('1. Checking Loops configuration...');
    const loopsEnabled = process.env.LOOPS_SYNC_ENABLED === 'true';
    const loopsApiKey = !!process.env.LOOPS_API_KEY;
    
    console.log(`   - LOOPS_SYNC_ENABLED: ${loopsEnabled}`);
    console.log(`   - LOOPS_API_KEY configured: ${loopsApiKey}`);
    
    if (!loopsEnabled || !loopsApiKey) {
      console.log('❌ Loops sync is not properly configured');
      return;
    }

    // Test 2: Check recent voters and their sync status
    console.log('\n2. Checking recent voters...');
    const { data: recentVoters, error: votersError } = await supabase
      .from('voters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (votersError) {
      console.error('Error fetching voters:', votersError);
      return;
    }

    console.log(`   Found ${recentVoters?.length || 0} recent voters`);
    
    if (recentVoters && recentVoters.length > 0) {
      for (const voter of recentVoters) {
        console.log(`   - ${voter.email} (${voter.firstname} ${voter.lastname})`);
        
        // Check if there's a corresponding loops_outbox entry
        const { data: loopsOutbox } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('event_type', 'vote_cast')
          .contains('payload', { voter: { email: voter.email } })
          .order('created_at', { ascending: false })
          .limit(1);

        if (loopsOutbox && loopsOutbox.length > 0) {
          console.log(`     ✅ Loops outbox entry found: ${loopsOutbox[0].status}`);
        } else {
          console.log(`     ❌ No Loops outbox entry found`);
        }
      }
    }

    // Test 3: Check approved nominees and their sync status
    console.log('\n3. Checking approved nominees...');
    const { data: approvedNominations, error: nominationsError } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'approved')
      .order('approved_at', { ascending: false })
      .limit(5);

    if (nominationsError) {
      console.error('Error fetching approved nominations:', nominationsError);
      return;
    }

    console.log(`   Found ${approvedNominations?.length || 0} approved nominations`);
    
    if (approvedNominations && approvedNominations.length > 0) {
      for (const nomination of approvedNominations) {
        console.log(`   - ${nomination.nominee_display_name} (${nomination.nominee_type})`);
        
        // Check if there's a corresponding loops_outbox entry for approval
        const { data: loopsOutbox } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('event_type', 'nomination_approved')
          .eq('payload->nominationId', nomination.nomination_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (loopsOutbox && loopsOutbox.length > 0) {
          console.log(`     ✅ Loops outbox entry found: ${loopsOutbox[0].status}`);
        } else {
          console.log(`     ❌ No Loops outbox entry found for approval`);
        }
      }
    }

    // Test 4: Check nominators and their sync status
    console.log('\n4. Checking nominators...');
    const { data: recentNominators, error: nominatorsError } = await supabase
      .from('nominators')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (nominatorsError) {
      console.error('Error fetching nominators:', nominatorsError);
      return;
    }

    console.log(`   Found ${recentNominators?.length || 0} recent nominators`);
    
    if (recentNominators && recentNominators.length > 0) {
      for (const nominator of recentNominators) {
        console.log(`   - ${nominator.email} (${nominator.firstname} ${nominator.lastname})`);
        
        // Check if there's a corresponding loops_outbox entry for submission
        const { data: loopsOutbox } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('event_type', 'nomination_submitted')
          .contains('payload', { nominator: { email: nominator.email } })
          .order('created_at', { ascending: false })
          .limit(1);

        if (loopsOutbox && loopsOutbox.length > 0) {
          console.log(`     ✅ Loops outbox entry found: ${loopsOutbox[0].status}`);
        } else {
          console.log(`     ❌ No Loops outbox entry found for submission`);
        }

        // Check if nominator has approved nominations (should be "Nominator Live")
        const { data: approvedNoms } = await supabase
          .from('nominations')
          .select('*')
          .eq('nominator_id', nominator.id)
          .eq('state', 'approved');

        if (approvedNoms && approvedNoms.length > 0) {
          console.log(`     📈 Has ${approvedNoms.length} approved nomination(s) - should be "Nominator Live"`);
        }
      }
    }

    // Test 5: Check loops_outbox table status
    console.log('\n5. Checking Loops outbox status...');
    const { data: outboxStats } = await supabase
      .from('loops_outbox')
      .select('status, event_type')
      .then(result => {
        if (result.error) throw result.error;
        
        const stats = result.data.reduce((acc, item) => {
          const key = `${item.event_type}_${item.status}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        return { data: stats };
      });

    console.log('   Outbox statistics:');
    Object.entries(outboxStats || {}).forEach(([key, count]) => {
      console.log(`   - ${key}: ${count}`);
    });

    // Test 6: Test actual Loops API connection
    console.log('\n6. Testing Loops API connection...');
    try {
      const { testLoopsConnection } = await import('../src/server/loops/realtime-sync.js');
      const connectionTest = await testLoopsConnection();
      
      if (connectionTest.success) {
        console.log('   ✅ Loops API connection successful');
      } else {
        console.log(`   ❌ Loops API connection failed: ${connectionTest.error}`);
      }
    } catch (importError) {
      console.log(`   ❌ Failed to import Loops sync module: ${importError.message}`);
    }

    // Test 7: Check for missing user group updates
    console.log('\n7. Identifying specific issues...');
    
    // Issue 1: Voters not getting "Voters" user group
    const { data: pendingVoterSyncs } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('event_type', 'vote_cast')
      .eq('status', 'pending');

    if (pendingVoterSyncs && pendingVoterSyncs.length > 0) {
      console.log(`   ❌ ${pendingVoterSyncs.length} pending voter syncs - user groups not updating`);
    }

    // Issue 2: Nominees not syncing when approved
    const { data: pendingNomineeSyncs } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('event_type', 'nomination_approved')
      .eq('status', 'pending');

    if (pendingNomineeSyncs && pendingNomineeSyncs.length > 0) {
      console.log(`   ❌ ${pendingNomineeSyncs.length} pending nominee syncs - not syncing when live`);
    }

    // Issue 3: Nominators not updating to "Nominator Live"
    const { data: pendingNominatorUpdates } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('event_type', 'nominator_live_update')
      .eq('status', 'pending');

    if (pendingNominatorUpdates && pendingNominatorUpdates.length > 0) {
      console.log(`   ❌ ${pendingNominatorUpdates.length} pending nominator live updates`);
    }

    console.log('\n✅ Loops user groups debug completed');

  } catch (error) {
    console.error('❌ Error during Loops debug:', error);
  }
}

// Run the test
testLoopsUserGroups().catch(console.error);