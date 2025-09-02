#!/usr/bin/env node

/**
 * Test Approval Workflow for Loops
 * Test the complete approval workflow to ensure nominees sync and nominators update
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApprovalWorkflowLoops() {
  console.log('🧪 Testing Approval Workflow for Loops...\n');

  try {
    // Find a submitted nomination to test with
    const { data: submittedNominations } = await supabase
      .from('admin_nominations')
      .select('*')
      .eq('state', 'submitted')
      .limit(1);

    if (!submittedNominations || submittedNominations.length === 0) {
      console.log('❌ No submitted nominations found for testing');
      return;
    }

    const testNomination = submittedNominations[0];
    console.log(`Found test nomination: ${testNomination.nominee_display_name}`);
    console.log(`  Nominator: ${testNomination.nominator_email}`);
    console.log(`  Type: ${testNomination.nominee_type}`);

    // Test the approval API call
    console.log('\n🔄 Testing approval API call...');
    
    const approvalData = {
      nominationId: testNomination.nomination_id,
      liveUrl: `https://worldstaffingawards.com/nominee/${testNomination.nomination_id}`,
      adminNotes: 'Test approval for Loops integration'
    };

    console.log('Calling approval API...');
    
    const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(approvalData),
    });

    if (approvalResponse.ok) {
      const approvalResult = await approvalResponse.json();
      console.log('✅ Approval API call successful');
      console.log(`  State: ${approvalResult.state}`);
      console.log(`  Live URL: ${approvalResult.liveUrl}`);

      // Wait a moment for the sync to process
      console.log('\n⏳ Waiting for sync processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if loops_outbox entry was created
      console.log('\n🔍 Checking loops_outbox entry...');
      
      const { data: outboxEntry } = await supabase
        .from('loops_outbox')
        .select('*')
        .eq('event_type', 'nomination_approved')
        .eq('payload->nominationId', testNomination.nomination_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (outboxEntry) {
        console.log(`✅ Loops outbox entry created: ${outboxEntry.status}`);
        console.log(`  Event type: ${outboxEntry.event_type}`);
        console.log(`  Has nominee data: ${!!outboxEntry.payload.nominee}`);
        console.log(`  Has nominator data: ${!!outboxEntry.payload.nominator}`);
        console.log(`  Has live URL: ${!!outboxEntry.payload.liveUrl}`);
        
        if (outboxEntry.last_error) {
          console.log(`  Error: ${outboxEntry.last_error}`);
        }

        // If it's pending, try to process it
        if (outboxEntry.status === 'pending') {
          console.log('\n🔧 Processing the outbox entry...');
          
          const apiKey = process.env.LOOPS_API_KEY;
          const baseUrl = 'https://app.loops.so/api/v1';
          const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          };

          try {
            // Mark as processing
            await supabase
              .from('loops_outbox')
              .update({ 
                status: 'processing',
                attempt_count: outboxEntry.attempt_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', outboxEntry.id);

            const nominee = outboxEntry.payload.nominee;
            let success = false;

            // Determine nominee email
            let nomineeEmail;
            if (outboxEntry.payload.type === 'person') {
              nomineeEmail = nominee.person_email;
            } else {
              nomineeEmail = nominee.company_email || `contact@${nominee.company_name?.toLowerCase().replace(/\s+/g, '')}.com`;
            }

            if (nomineeEmail) {
              console.log(`  Syncing nominee: ${nomineeEmail}`);

              // Create nominee contact data
              const nomineeContactData = {
                email: nomineeEmail.toLowerCase(),
                firstName: nominee.firstname || 'Company',
                lastName: nominee.lastname || nominee.company_name || 'Nominee',
                source: 'World Staffing Awards 2026',
                nomineeType: outboxEntry.payload.type,
                category: outboxEntry.payload.subcategoryId,
                nominationId: outboxEntry.payload.nominationId,
              };

              // Add optional fields
              if (nominee.person_linkedin || nominee.company_linkedin) {
                nomineeContactData.linkedin = nominee.person_linkedin || nominee.company_linkedin;
              }
              if (nominee.jobtitle) nomineeContactData.jobTitle = nominee.jobtitle;
              if (nominee.person_company || nominee.company_name) {
                nomineeContactData.company = nominee.person_company || nominee.company_name;
              }
              if (nominee.person_phone || nominee.company_phone) {
                nomineeContactData.phone = nominee.person_phone || nominee.company_phone;
              }
              if (nominee.person_country || nominee.company_country) {
                nomineeContactData.country = nominee.person_country || nominee.company_country;
              }
              if (outboxEntry.payload.liveUrl) {
                nomineeContactData.liveUrl = outboxEntry.payload.liveUrl;
              }

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

                // Set user group
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
                  success = true;
                } else {
                  console.log(`    ⚠️ Failed to set userGroup: ${userGroupResult.status}`);
                  success = true; // Don't fail for userGroup issues
                }

                // Update nominator to "Nominator Live"
                if (outboxEntry.payload.nominator && outboxEntry.payload.liveUrl) {
                  console.log(`  Updating nominator: ${outboxEntry.payload.nominator.email}`);

                  const nomineeName = outboxEntry.payload.type === 'person' 
                    ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
                    : nominee.company_name || '';

                  const nominatorUpdateResult = await fetch(`${baseUrl}/contacts/update`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                      email: outboxEntry.payload.nominator.email.toLowerCase(),
                      userGroup: 'Nominator Live',
                      nomineeName: nomineeName,
                      nomineeLiveUrl: outboxEntry.payload.liveUrl,
                      approvalDate: new Date().toISOString(),
                    }),
                  });

                  if (nominatorUpdateResult.ok) {
                    console.log(`    ✅ Nominator updated to "Nominator Live"`);
                  } else {
                    console.log(`    ⚠️ Failed to update nominator: ${nominatorUpdateResult.status}`);
                  }
                }
              } else {
                console.log(`    ❌ Failed to sync nominee: ${contactResult.status}`);
              }
            }

            if (success) {
              // Mark as done
              await supabase
                .from('loops_outbox')
                .update({ 
                  status: 'done',
                  last_error: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', outboxEntry.id);

              console.log(`  ✅ Outbox entry processed successfully`);
            } else {
              // Mark as failed
              await supabase
                .from('loops_outbox')
                .update({ 
                  status: 'pending',
                  last_error: 'Failed to sync nominee to Loops',
                  updated_at: new Date().toISOString()
                })
                .eq('id', outboxEntry.id);

              console.log(`  ❌ Failed to process outbox entry`);
            }

          } catch (error) {
            console.log(`  ❌ Error processing outbox entry: ${error.message}`);
          }
        }

        // Verify the results in Loops
        console.log('\n🔍 Verifying results in Loops...');
        
        // Check nominee
        const nomineeEmail = testNomination.nominee_type === 'person' 
          ? testNomination.nominee_email 
          : `contact@${testNomination.nominee_display_name?.toLowerCase().replace(/\s+/g, '')}.com`;

        if (nomineeEmail) {
          try {
            const nomineeLoopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${nomineeEmail}`, {
              headers: {
                'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
              },
            });

            if (nomineeLoopsResponse.ok) {
              const nomineeContacts = await nomineeLoopsResponse.json();
              if (nomineeContacts && nomineeContacts.length > 0) {
                const contact = nomineeContacts[0];
                console.log(`✅ Nominee found in Loops:`);
                console.log(`  - UserGroup: ${contact.userGroup}`);
                console.log(`  - Live URL: ${contact.liveUrl || 'None'}`);
              } else {
                console.log(`❌ Nominee not found in Loops`);
              }
            }
          } catch (error) {
            console.log(`❌ Error checking nominee in Loops: ${error.message}`);
          }
        }

        // Check nominator
        if (testNomination.nominator_email) {
          try {
            const nominatorLoopsResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${testNomination.nominator_email}`, {
              headers: {
                'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
              },
            });

            if (nominatorLoopsResponse.ok) {
              const nominatorContacts = await nominatorLoopsResponse.json();
              if (nominatorContacts && nominatorContacts.length > 0) {
                const contact = nominatorContacts[0];
                console.log(`✅ Nominator found in Loops:`);
                console.log(`  - UserGroup: ${contact.userGroup}`);
                console.log(`  - Nominee Name: ${contact.nomineeName || 'None'}`);
                console.log(`  - Nominee Live URL: ${contact.nomineeLiveUrl || 'None'}`);
              } else {
                console.log(`❌ Nominator not found in Loops`);
              }
            }
          } catch (error) {
            console.log(`❌ Error checking nominator in Loops: ${error.message}`);
          }
        }

      } else {
        console.log('❌ No loops outbox entry found');
      }

    } else {
      const errorText = await approvalResponse.text();
      console.log(`❌ Approval API call failed: ${approvalResponse.status}`);
      console.log(`Error: ${errorText}`);
    }

    console.log('\n✅ Approval workflow test completed');

  } catch (error) {
    console.error('❌ Error during approval workflow test:', error);
  }
}

// Run the test
testApprovalWorkflowLoops().catch(console.error);