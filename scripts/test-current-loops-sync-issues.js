#!/usr/bin/env node

/**
 * Test Current Loops Sync Issues
 * Identify why nominees aren't syncing after approval and nominators aren't updating
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCurrentLoopsSyncIssues() {
  console.log('🔍 Testing Current Loops Sync Issues...\n');

  try {
    // 1. Check if loops_outbox table exists and is working
    console.log('1. Checking loops_outbox table...');
    
    const { data: outboxData, error: outboxError } = await supabase
      .from('loops_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (outboxError) {
      console.error('   ❌ Error accessing loops_outbox:', outboxError);
      return;
    }

    console.log(`   ✅ loops_outbox table exists with ${outboxData?.length || 0} records`);
    
    if (outboxData && outboxData.length > 0) {
      console.log('   Recent outbox entries:');
      outboxData.forEach(item => {
        console.log(`     - ${item.event_type}: ${item.status} (${item.created_at})`);
        if (item.last_error) {
          console.log(`       Error: ${item.last_error}`);
        }
      });
    }

    // 2. Check recent approved nominations
    console.log('\n2. Checking recent approved nominations...');
    
    const { data: recentApprovals, error: approvalsError } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'approved')
      .order('approved_at', { ascending: false })
      .limit(5);

    if (approvalsError) {
      console.error('   ❌ Error fetching approvals:', approvalsError);
      return;
    }

    console.log(`   Found ${recentApprovals?.length || 0} recent approved nominations`);

    if (recentApprovals && recentApprovals.length > 0) {
      for (const approval of recentApprovals) {
        console.log(`\n   Nomination: ${approval.nominee_display_name}`);
        console.log(`     - Approved: ${approval.approved_at}`);
        console.log(`     - Nominator: ${approval.nominator_email}`);
        console.log(`     - Type: ${approval.nominee_type}`);
        
        // Check if there's a loops_outbox entry for this approval
        const { data: outboxEntry } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('event_type', 'nomination_approved')
          .eq('payload->nominationId', approval.nomination_id)
          .single();

        if (outboxEntry) {
          console.log(`     - Loops outbox: ${outboxEntry.status}`);
          if (outboxEntry.last_error) {
            console.log(`     - Error: ${outboxEntry.last_error}`);
          }
        } else {
          console.log(`     - ❌ No loops outbox entry found`);
        }

        // Check if nominee is in Loops
        const nomineeEmail = approval.nominee_type === 'person' 
          ? approval.nominee_email 
          : `contact@${approval.nominee_display_name?.toLowerCase().replace(/\s+/g, '')}.com`;

        if (nomineeEmail) {
          try {
            const loopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${nomineeEmail}`, {
              headers: {
                'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
              },
            });

            if (loopsResponse.ok) {
              const loopsContacts = await loopsResponse.json();
              if (loopsContacts && loopsContacts.length > 0) {
                const contact = loopsContacts[0];
                console.log(`     - ✅ Found in Loops: userGroup="${contact.userGroup}", liveUrl="${contact.liveUrl || 'None'}"`);
              } else {
                console.log(`     - ❌ Not found in Loops`);
              }
            } else {
              console.log(`     - ❌ Failed to check Loops: ${loopsResponse.status}`);
            }
          } catch (error) {
            console.log(`     - ❌ Error checking Loops: ${error.message}`);
          }
        }

        // Check if nominator is updated to "Nominator Live"
        if (approval.nominator_email) {
          try {
            const nominatorLoopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${approval.nominator_email}`, {
              headers: {
                'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
              },
            });

            if (nominatorLoopsResponse.ok) {
              const nominatorContacts = await nominatorLoopsResponse.json();
              if (nominatorContacts && nominatorContacts.length > 0) {
                const contact = nominatorContacts[0];
                console.log(`     - Nominator in Loops: userGroup="${contact.userGroup}"`);
                if (contact.nomineeLiveUrl) {
                  console.log(`       - Nominee Live URL: ${contact.nomineeLiveUrl}`);
                }
              } else {
                console.log(`     - ❌ Nominator not found in Loops`);
              }
            }
          } catch (error) {
            console.log(`     - ❌ Error checking nominator in Loops: ${error.message}`);
          }
        }
      }
    }

    // 3. Test the approval process by simulating it
    console.log('\n3. Testing approval process simulation...');
    
    // Find a submitted nomination to test with
    const { data: submittedNominations } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'submitted')
      .limit(1);

    if (submittedNominations && submittedNominations.length > 0) {
      const testNomination = submittedNominations[0];
      console.log(`   Found test nomination: ${testNomination.nominee_display_name}`);
      
      // Check if the approval API would create the correct outbox entry
      console.log('   Testing what would happen on approval...');
      
      const testPayload = {
        nominationId: testNomination.nomination_id,
        liveUrl: `https://worldstaffingawards.com/nominee/${testNomination.nomination_id}`,
        type: testNomination.nominee_type,
        subcategoryId: testNomination.subcategory_id,
        displayName: testNomination.nominee_display_name,
        nominee: {
          // This would come from the nominee data
          firstname: testNomination.nominee_firstname,
          lastname: testNomination.nominee_lastname,
          person_email: testNomination.nominee_email,
          // ... other fields
        },
        nominator: {
          // This would come from the nominator data
          email: testNomination.nominator_email,
          firstname: testNomination.nominator_firstname,
          lastname: testNomination.nominator_lastname,
        }
      };
      
      console.log('   Test payload structure:');
      console.log('     - Has nominee data:', !!testPayload.nominee);
      console.log('     - Has nominator data:', !!testPayload.nominator);
      console.log('     - Has live URL:', !!testPayload.liveUrl);
      console.log('     - Nominee email:', testPayload.nominee.person_email || 'None');
      console.log('     - Nominator email:', testPayload.nominator.email || 'None');
    } else {
      console.log('   No submitted nominations found for testing');
    }

    // 4. Check Loops API configuration
    console.log('\n4. Checking Loops API configuration...');
    
    const loopsEnabled = process.env.LOOPS_SYNC_ENABLED === 'true';
    const loopsApiKey = !!process.env.LOOPS_API_KEY;
    
    console.log(`   - LOOPS_SYNC_ENABLED: ${loopsEnabled}`);
    console.log(`   - LOOPS_API_KEY configured: ${loopsApiKey}`);
    
    if (loopsEnabled && loopsApiKey) {
      // Test API connection
      try {
        const testResponse = await fetch('https://app.loops.so/api/v1/contacts/find?email=test@example.com', {
          headers: {
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          },
        });
        
        if (testResponse.ok || testResponse.status === 404) {
          console.log('   ✅ Loops API connection working');
        } else {
          console.log(`   ❌ Loops API connection failed: ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Loops API connection error: ${error.message}`);
      }
    }

    console.log('\n✅ Current Loops sync issues analysis completed');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Run the test
testCurrentLoopsSyncIssues().catch(console.error);