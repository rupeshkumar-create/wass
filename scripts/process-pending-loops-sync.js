#!/usr/bin/env node

/**
 * Process Pending Loops Sync
 * Call the Loops sync API with proper authorization
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processPendingLoopsSync() {
  console.log('🔧 Processing Pending Loops Sync...\n');

  try {
    // First, let's check what's pending
    const { data: pendingItems, error: fetchError } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching pending items:', fetchError);
      return;
    }

    console.log(`Found ${pendingItems?.length || 0} pending items`);

    if (pendingItems && pendingItems.length > 0) {
      for (const item of pendingItems) {
        console.log(`\nItem ${item.id}: ${item.event_type}`);
        console.log(`  Created: ${item.created_at}`);
        console.log(`  Attempts: ${item.attempt_count}`);
        if (item.last_error) {
          console.log(`  Last error: ${item.last_error}`);
        }
        
        // Show payload summary
        if (item.payload) {
          if (item.event_type === 'nomination_approved') {
            console.log(`  Nominee: ${item.payload.nominee?.firstname || item.payload.nominee?.company_name || 'Unknown'}`);
            console.log(`  Nominator: ${item.payload.nominator?.email || 'Unknown'}`);
            console.log(`  Live URL: ${item.payload.liveUrl || 'None'}`);
          }
        }
      }

      // Now let's manually process these using direct Loops API calls
      console.log('\n🔄 Processing items manually...');

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

      let processed = 0;
      let errors = 0;

      for (const item of pendingItems) {
        console.log(`\nProcessing ${item.event_type} for item ${item.id}...`);

        try {
          // Mark as processing
          await supabase
            .from('loops_outbox')
            .update({ 
              status: 'processing',
              attempt_count: item.attempt_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          let success = false;

          if (item.event_type === 'nomination_approved' && item.payload.nominee) {
            const nominee = item.payload.nominee;
            
            // Determine email for nominee
            let nomineeEmail;
            if (item.payload.type === 'person') {
              nomineeEmail = nominee.person_email;
            } else {
              // For company, create a placeholder email
              nomineeEmail = nominee.company_email || `contact@${nominee.company_name?.toLowerCase().replace(/\s+/g, '')}.com`;
            }

            if (nomineeEmail) {
              console.log(`  Syncing nominee: ${nomineeEmail}`);

              // Create/update nominee contact
              const nomineeContactData = {
                email: nomineeEmail.toLowerCase(),
                firstName: nominee.firstname || 'Company',
                lastName: nominee.lastname || nominee.company_name || 'Nominee',
                source: 'World Staffing Awards 2026',
                nomineeType: item.payload.type,
                category: item.payload.subcategoryId,
                nominationId: item.payload.nominationId,
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
              if (item.payload.liveUrl) {
                nomineeContactData.liveUrl = item.payload.liveUrl;
              }

              // Create or update contact
              let contactResult;
              try {
                contactResult = await fetch(`${baseUrl}/contacts/create`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(nomineeContactData),
                });
              } catch (createError) {
                console.log(`    Failed to create, trying update: ${createError.message}`);
              }

              if (!contactResult || !contactResult.ok) {
                // Try update instead
                contactResult = await fetch(`${baseUrl}/contacts/update`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(nomineeContactData),
                });
              }

              if (contactResult && contactResult.ok) {
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

                // Update nominator to "Nominator Live" if we have the data
                if (item.payload.nominator && item.payload.liveUrl) {
                  console.log(`  Updating nominator: ${item.payload.nominator.email}`);

                  const nomineeName = item.payload.type === 'person' 
                    ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
                    : nominee.company_name || '';

                  const nominatorUpdateResult = await fetch(`${baseUrl}/contacts/update`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                      email: item.payload.nominator.email.toLowerCase(),
                      userGroup: 'Nominator Live',
                      nomineeName: nomineeName,
                      nomineeLiveUrl: item.payload.liveUrl,
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
                console.log(`    ❌ Failed to sync nominee: ${contactResult?.status || 'Unknown error'}`);
              }
            } else {
              console.log(`    ❌ No email found for nominee`);
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
              .eq('id', item.id);

            processed++;
            console.log(`  ✅ Successfully processed item ${item.id}`);
          } else {
            // Mark as failed
            await supabase
              .from('loops_outbox')
              .update({ 
                status: 'pending',
                last_error: 'Failed to sync to Loops',
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);

            errors++;
            console.log(`  ❌ Failed to process item ${item.id}`);
          }

        } catch (error) {
          // Mark as failed
          await supabase
            .from('loops_outbox')
            .update({ 
              status: 'pending',
              last_error: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          errors++;
          console.log(`  ❌ Error processing item ${item.id}: ${error.message}`);
        }
      }

      console.log(`\n🏁 Processing completed: ${processed} processed, ${errors} errors`);
    }

    console.log('\n✅ Pending Loops sync processing completed');

  } catch (error) {
    console.error('❌ Error during processing:', error);
  }
}

// Run the processing
processPendingLoopsSync().catch(console.error);