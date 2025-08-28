#!/usr/bin/env node

/**
 * Sync Missed Approvals
 * Manually sync approved nominations that were missed by the Loops integration
 * This handles nominations that were approved before the Loops integration was working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncMissedApprovals() {
  console.log('🔧 Syncing Missed Approvals to Loops...\n');

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.log('❌ LOOPS_API_KEY not configured');
    return;
  }

  const baseUrl = 'https://app.loops.so/api/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Get approved nominations that don't have loops_outbox entries
    console.log('1. Finding approved nominations without Loops sync...');
    
    const { data: approvedNominations } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'approved')
      .order('created_at', { ascending: false });

    if (!approvedNominations || approvedNominations.length === 0) {
      console.log('No approved nominations found');
      return;
    }

    console.log(`Found ${approvedNominations.length} approved nominations`);

    let processed = 0;
    let errors = 0;

    for (const nomination of approvedNominations) {
      console.log(`\nProcessing: ${nomination.nominee_display_name}`);
      console.log(`  Nominator: ${nomination.nominator_email}`);
      console.log(`  Nominee: ${nomination.nominee_email || 'No email'}`);

      try {
        // Check if there's already a loops_outbox entry for this nomination
        const { data: existingOutbox } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('event_type', 'nomination_approved')
          .eq('payload->nominationId', nomination.nomination_id)
          .single();

        if (existingOutbox) {
          console.log(`  ⏭️ Already has outbox entry (${existingOutbox.status}), skipping`);
          continue;
        }

        // Sync nominee to Loops
        let nomineeEmail;
        if (nomination.nominee_type === 'person') {
          nomineeEmail = nomination.nominee_email;
        } else {
          // For company, create a placeholder email
          nomineeEmail = `contact@${nomination.nominee_display_name?.toLowerCase().replace(/\s+/g, '')}.com`;
        }

        if (nomineeEmail) {
          console.log(`  🔄 Syncing nominee: ${nomineeEmail}`);

          // Create nominee contact data
          const nomineeContactData = {
            email: nomineeEmail.toLowerCase(),
            firstName: nomination.nominee_firstname || 'Company',
            lastName: nomination.nominee_lastname || nomination.nominee_display_name || 'Nominee',
            source: 'World Staffing Awards 2026',
            nomineeType: nomination.nominee_type,
            category: nomination.subcategory_id,
            nominationId: nomination.nomination_id,
          };

          // Add optional fields
          if (nomination.nominee_linkedin) {
            nomineeContactData.linkedin = nomination.nominee_linkedin;
          }
          if (nomination.nominee_jobtitle) {
            nomineeContactData.jobTitle = nomination.nominee_jobtitle;
          }
          if (nomination.nominee_type === 'person' && nomination.nominator_company) {
            nomineeContactData.company = nomination.nominator_company;
          }

          // Generate live URL
          const liveUrl = `https://worldstaffingawards.com/nominee/${nomination.nomination_id}`;
          nomineeContactData.liveUrl = liveUrl;

          // Create or update nominee contact
          let contactResult = await fetch(`${baseUrl}/contacts/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(nomineeContactData),
          });

          if (!contactResult.ok && contactResult.status === 409) {
            contactResult = await fetch(`${baseUrl}/contacts/update`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(nomineeContactData),
            });
          }

          if (contactResult.ok) {
            console.log(`    ✅ Nominee contact synced`);

            // Set user group to "Nominess"
            const userGroupResult = await fetch(`${baseUrl}/contacts/update`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                email: nomineeEmail.toLowerCase(),
                userGroup: 'Nominess',
              }),
            });

            if (userGroupResult.ok) {
              console.log(`    ✅ Nominee userGroup set to "Nominess"`);
            } else {
              console.log(`    ⚠️ Failed to set nominee userGroup: ${userGroupResult.status}`);
            }

            // Update nominator to "Nominator Live"
            if (nomination.nominator_email) {
              console.log(`  🔄 Updating nominator: ${nomination.nominator_email}`);

              const nominatorUpdateResult = await fetch(`${baseUrl}/contacts/update`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                  email: nomination.nominator_email.toLowerCase(),
                  userGroup: 'Nominator Live',
                  nomineeName: nomination.nominee_display_name,
                  nomineeLiveUrl: liveUrl,
                  approvalDate: new Date().toISOString(),
                }),
              });

              if (nominatorUpdateResult.ok) {
                console.log(`    ✅ Nominator updated to "Nominator Live"`);
              } else {
                console.log(`    ⚠️ Failed to update nominator: ${nominatorUpdateResult.status}`);
              }
            }

            processed++;
            console.log(`  ✅ Successfully processed`);

          } else {
            console.log(`    ❌ Failed to sync nominee: ${contactResult.status}`);
            errors++;
          }
        } else {
          console.log(`  ⚠️ No email found for nominee, skipping`);
        }

      } catch (error) {
        console.log(`  ❌ Error processing: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n🏁 Missed approvals sync completed: ${processed} processed, ${errors} errors`);

    // Verify the specific cases mentioned
    console.log('\n🔍 Verifying specific cases...');
    
    const casesToVerify = [
      { email: 'rafyuyospe@necub.com', type: 'nominator', expected: 'Nominator Live' },
      { email: 'higilip579@besaies.com', type: 'nominee', expected: 'Nominess' },
    ];

    for (const testCase of casesToVerify) {
      console.log(`\nChecking ${testCase.type}: ${testCase.email}`);
      
      try {
        const response = await fetch(`${baseUrl}/contacts/find?email=${testCase.email}`, {
          headers,
        });

        if (response.ok) {
          const contacts = await response.json();
          if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            console.log(`  ✅ Found in Loops:`);
            console.log(`    - UserGroup: "${contact.userGroup}"`);
            
            if (testCase.type === 'nominee') {
              console.log(`    - Live URL: ${contact.liveUrl || 'None'}`);
            } else if (testCase.type === 'nominator') {
              console.log(`    - Nominee Name: ${contact.nomineeName || 'None'}`);
              console.log(`    - Nominee Live URL: ${contact.nomineeLiveUrl || 'None'}`);
            }
            
            if (contact.userGroup === testCase.expected) {
              console.log(`    ✅ Correct user group`);
            } else {
              console.log(`    ❌ Wrong user group: expected "${testCase.expected}", got "${contact.userGroup}"`);
            }
          } else {
            console.log(`  ❌ Not found in Loops`);
          }
        } else {
          console.log(`  ❌ Failed to check: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking: ${error.message}`);
      }
    }

    console.log('\n✅ Missed approvals sync and verification completed');

  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

// Run the sync
syncMissedApprovals().catch(console.error);