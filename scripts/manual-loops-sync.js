#!/usr/bin/env node

/**
 * Manual Loops Sync
 * Manually process pending loops_outbox items
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function manualLoopsSync() {
  console.log('🔧 Manual Loops Sync...\n');

  try {
    // Import the sync functions
    const { 
      syncNominatorToLoops, 
      syncNomineeToLoops, 
      syncVoterToLoops,
      updateNominatorToLive 
    } = await import('../src/server/loops/realtime-sync.js');

    // Get pending items
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

    if (!pendingItems || pendingItems.length === 0) {
      console.log('No pending items to process');
      return;
    }

    let processed = 0;
    let errors = 0;

    // Process each item
    for (const item of pendingItems) {
      console.log(`\nProcessing item ${item.id}: ${item.event_type}`);
      
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

        let syncResult = { success: false, error: 'Unknown event type' };

        // Process based on event type
        switch (item.event_type) {
          case 'nomination_submitted':
            console.log('  Processing nomination submission...');
            if (item.payload.nominator) {
              syncResult = await syncNominatorToLoops({
                firstname: item.payload.nominator.firstname,
                lastname: item.payload.nominator.lastname,
                email: item.payload.nominator.email,
                linkedin: item.payload.nominator.linkedin,
                company: item.payload.nominator.company,
                jobTitle: item.payload.nominator.jobTitle,
                phone: item.payload.nominator.phone,
                country: item.payload.nominator.country,
              });
            }
            break;

          case 'nomination_approved':
            console.log('  Processing nomination approval...');
            if (item.payload.nominee) {
              const nominee = item.payload.nominee;
              
              console.log(`  Syncing nominee: ${nominee.firstname || nominee.company_name}`);
              
              // Sync nominee with correct field mapping
              syncResult = await syncNomineeToLoops({
                type: item.payload.type,
                subcategoryId: item.payload.subcategoryId,
                nominationId: item.payload.nominationId,
                liveUrl: item.payload.liveUrl,
                // Person fields
                firstname: nominee.firstname,
                lastname: nominee.lastname,
                email: nominee.person_email,
                linkedin: nominee.person_linkedin,
                jobtitle: nominee.jobtitle,
                company: nominee.person_company,
                phone: nominee.person_phone,
                country: nominee.person_country,
                // Company fields
                companyName: nominee.company_name,
                companyWebsite: nominee.company_website,
                companyLinkedin: nominee.company_linkedin,
                companyEmail: nominee.company_email,
                companyPhone: nominee.company_phone,
                companyCountry: nominee.company_country,
                companyIndustry: nominee.company_industry,
                companySize: nominee.company_size,
              });

              // Also update nominator to "Nominator Live" if we have the data
              if (syncResult.success && item.payload.nominator && item.payload.liveUrl) {
                console.log(`  Updating nominator to "Nominator Live": ${item.payload.nominator.email}`);
                
                const nomineeName = item.payload.type === 'person' 
                  ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
                  : nominee.company_name || '';

                const nominatorUpdateResult = await updateNominatorToLive(
                  item.payload.nominator.email,
                  {
                    name: nomineeName,
                    liveUrl: item.payload.liveUrl
                  }
                );

                if (nominatorUpdateResult.success) {
                  console.log(`  ✅ Updated nominator to "Nominator Live": ${item.payload.nominator.email}`);
                } else {
                  console.log(`  ⚠️ Failed to update nominator to live: ${nominatorUpdateResult.error}`);
                }
              }
            }
            break;

          case 'vote_cast':
            console.log('  Processing vote...');
            if (item.payload.voter) {
              syncResult = await syncVoterToLoops({
                firstname: item.payload.voter.firstname,
                lastname: item.payload.voter.lastname,
                email: item.payload.voter.email,
                linkedin: item.payload.voter.linkedin,
                company: item.payload.voter.company,
                jobTitle: item.payload.voter.job_title,
                country: item.payload.voter.country,
                votedFor: item.payload.votedForDisplayName,
                subcategoryId: item.payload.subcategoryId,
              });
            }
            break;
        }

        if (syncResult.success) {
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
              last_error: syncResult.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          errors++;
          console.log(`  ❌ Failed to process item ${item.id}: ${syncResult.error}`);
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

    console.log(`\n🏁 Manual sync completed: ${processed} processed, ${errors} errors`);

  } catch (error) {
    console.error('❌ Error during manual sync:', error);
  }
}

// Run the sync
manualLoopsSync().catch(console.error);