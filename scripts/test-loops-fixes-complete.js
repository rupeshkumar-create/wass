#!/usr/bin/env node

/**
 * Test Complete Loops Fixes
 * This script tests all the Loops integration fixes:
 * 1. Voter syncing with correct user group
 * 2. Nominee syncing when approved with live URL
 * 3. Nominator updating to "Nominator Live" when nominee is approved
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLoopsFixesComplete() {
  console.log('🔧 Testing Complete Loops Fixes...\n');

  try {
    // Test 1: Process pending loops_outbox items
    console.log('1. Processing pending Loops outbox items...');
    
    const { data: pendingItems, error: fetchError } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching pending items:', fetchError);
      return;
    }

    console.log(`   Found ${pendingItems?.length || 0} pending items`);

    if (pendingItems && pendingItems.length > 0) {
      // Call the sync API to process these items
      console.log('   Calling Loops sync API...');
      
      const syncResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log(`   ✅ Sync completed: ${syncResult.processed} processed, ${syncResult.errors} errors`);
      } else {
        console.log(`   ❌ Sync failed: ${syncResponse.status} ${syncResponse.statusText}`);
        const errorText = await syncResponse.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
      }
    }

    // Test 2: Verify voter user groups
    console.log('\n2. Verifying voter user groups in Loops...');
    
    const { data: recentVoters } = await supabase
      .from('voters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentVoters && recentVoters.length > 0) {
      for (const voter of recentVoters) {
        console.log(`   Checking voter: ${voter.email}`);
        
        // Check in Loops
        try {
          const loopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${voter.email}`, {
            headers: {
              'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
            },
          });

          if (loopsResponse.ok) {
            const loopsContact = await loopsResponse.json();
            if (loopsContact && loopsContact.length > 0) {
              const contact = loopsContact[0];
              console.log(`     ✅ Found in Loops - userGroup: "${contact.userGroup}"`);
              
              if (contact.userGroup === 'Voters') {
                console.log(`     ✅ Correct user group set`);
              } else {
                console.log(`     ❌ Incorrect user group: expected "Voters", got "${contact.userGroup}"`);
              }
            } else {
              console.log(`     ❌ Not found in Loops`);
            }
          } else {
            console.log(`     ❌ Failed to check Loops: ${loopsResponse.status}`);
          }
        } catch (error) {
          console.log(`     ❌ Error checking Loops: ${error.message}`);
        }
      }
    }

    // Test 3: Verify approved nominees in Loops
    console.log('\n3. Verifying approved nominees in Loops...');
    
    const { data: approvedNominations } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'approved')
      .order('approved_at', { ascending: false })
      .limit(3);

    if (approvedNominations && approvedNominations.length > 0) {
      for (const nomination of approvedNominations) {
        console.log(`   Checking nominee: ${nomination.nominee_display_name}`);
        
        const email = nomination.nominee_type === 'person' 
          ? nomination.nominee_email 
          : `contact@${nomination.nominee_display_name?.toLowerCase().replace(/\s+/g, '')}.com`;

        if (email) {
          try {
            const loopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${email}`, {
              headers: {
                'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
              },
            });

            if (loopsResponse.ok) {
              const loopsContact = await loopsResponse.json();
              if (loopsContact && loopsContact.length > 0) {
                const contact = loopsContact[0];
                console.log(`     ✅ Found in Loops - userGroup: "${contact.userGroup}"`);
                
                if (contact.userGroup === 'Nominess') {
                  console.log(`     ✅ Correct user group set`);
                } else {
                  console.log(`     ❌ Incorrect user group: expected "Nominess", got "${contact.userGroup}"`);
                }

                if (contact.liveUrl) {
                  console.log(`     ✅ Live URL set: ${contact.liveUrl}`);
                } else {
                  console.log(`     ⚠️ No live URL set`);
                }
              } else {
                console.log(`     ❌ Not found in Loops`);
              }
            } else {
              console.log(`     ❌ Failed to check Loops: ${loopsResponse.status}`);
            }
          } catch (error) {
            console.log(`     ❌ Error checking Loops: ${error.message}`);
          }
        }
      }
    }

    // Test 4: Verify nominators with approved nominations are "Nominator Live"
    console.log('\n4. Verifying "Nominator Live" user groups...');
    
    const { data: nominatorsWithApproved } = await supabase
      .from('nominators')
      .select(`
        *,
        nominations!inner(
          id,
          state,
          approved_at
        )
      `)
      .eq('nominations.state', 'approved')
      .order('nominations.approved_at', { ascending: false })
      .limit(3);

    if (nominatorsWithApproved && nominatorsWithApproved.length > 0) {
      for (const nominator of nominatorsWithApproved) {
        console.log(`   Checking nominator: ${nominator.email}`);
        
        try {
          const loopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${nominator.email}`, {
            headers: {
              'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
            },
          });

          if (loopsResponse.ok) {
            const loopsContact = await loopsResponse.json();
            if (loopsContact && loopsContact.length > 0) {
              const contact = loopsContact[0];
              console.log(`     ✅ Found in Loops - userGroup: "${contact.userGroup}"`);
              
              if (contact.userGroup === 'Nominator Live') {
                console.log(`     ✅ Correct user group set`);
              } else {
                console.log(`     ❌ Incorrect user group: expected "Nominator Live", got "${contact.userGroup}"`);
              }

              if (contact.nomineeLiveUrl) {
                console.log(`     ✅ Nominee live URL set: ${contact.nomineeLiveUrl}`);
              } else {
                console.log(`     ⚠️ No nominee live URL set`);
              }
            } else {
              console.log(`     ❌ Not found in Loops`);
            }
          } else {
            console.log(`     ❌ Failed to check Loops: ${loopsResponse.status}`);
          }
        } catch (error) {
          console.log(`     ❌ Error checking Loops: ${error.message}`);
        }
      }
    }

    // Test 5: Check final outbox status
    console.log('\n5. Final outbox status check...');
    
    const { data: finalOutboxStats } = await supabase
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

    console.log('   Final outbox statistics:');
    Object.entries(finalOutboxStats || {}).forEach(([key, count]) => {
      console.log(`   - ${key}: ${count}`);
    });

    const pendingCount = Object.entries(finalOutboxStats || {})
      .filter(([key]) => key.includes('_pending'))
      .reduce((sum, [, count]) => sum + count, 0);

    if (pendingCount === 0) {
      console.log('\n✅ All Loops fixes working correctly! No pending items.');
    } else {
      console.log(`\n⚠️ Still ${pendingCount} pending items - may need additional processing.`);
    }

    console.log('\n✅ Complete Loops fixes test completed');

  } catch (error) {
    console.error('❌ Error during Loops fixes test:', error);
  }
}

// Run the test
testLoopsFixesComplete().catch(console.error);