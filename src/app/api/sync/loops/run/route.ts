import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase/client';
import { 
  syncNominatorToLoops, 
  syncNomineeToLoops, 
  syncVoterToLoops,
  updateNominatorToLive,
  testLoopsConnection,
  batchSyncToLoops
} from '@/server/loops/realtime-sync';

/**
 * Manual Loops sync endpoint
 * Processes pending items in loops_outbox table
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Loops sync is enabled
    if (process.env.LOOPS_SYNC_ENABLED !== 'true' || !process.env.LOOPS_API_KEY) {
      return NextResponse.json({
        message: 'Loops sync is disabled or not configured',
        enabled: false
      });
    }

    console.log('🔄 Starting manual Loops sync...');

    // Test connection first
    const connectionTest = await testLoopsConnection();
    if (!connectionTest.success) {
      return NextResponse.json({
        error: 'Loops connection failed',
        details: connectionTest.error
      }, { status: 500 });
    }

    // Get pending items from loops_outbox
    const { data: pendingItems, error: fetchError } = await supabaseAdmin
      .from('loops_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json({
        message: 'No pending Loops sync items',
        processed: 0
      });
    }

    console.log(`📋 Found ${pendingItems.length} pending Loops sync items`);

    let processed = 0;
    let errors = 0;

    // Process each item
    for (const item of pendingItems) {
      try {
        // Mark as processing
        await supabaseAdmin
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
            // Sync nominator with "Nominator 2026" tag
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
            // Sync nominee with "Nominess" user group and update nominator to "Nominator Live"
            if (item.payload.nominee) {
              const nominee = item.payload.nominee;
              
              // Sync nominee with correct field mapping
              syncResult = await syncNomineeToLoops({
                type: item.payload.type,
                subcategoryId: item.payload.subcategoryId,
                nominationId: item.payload.nominationId,
                liveUrl: item.payload.liveUrl,
                // Person fields (use correct field names from database)
                firstname: nominee.firstname,
                lastname: nominee.lastname,
                email: nominee.person_email, // Correct field name
                linkedin: nominee.person_linkedin, // Correct field name
                jobtitle: nominee.jobtitle,
                company: nominee.person_company, // Correct field name
                phone: nominee.person_phone, // Correct field name
                country: nominee.person_country, // Correct field name
                // Company fields (use correct field names from database)
                companyName: nominee.company_name, // Correct field name
                companyWebsite: nominee.company_website, // Correct field name
                companyLinkedin: nominee.company_linkedin, // Correct field name
                companyEmail: nominee.company_email, // Correct field name
                companyPhone: nominee.company_phone, // Correct field name
                companyCountry: nominee.company_country, // Correct field name
                companyIndustry: nominee.company_industry, // Correct field name
                companySize: nominee.company_size, // Correct field name
              });

              // Also update nominator to "Nominator Live" if we have the data
              if (syncResult.success && item.payload.nominator && item.payload.liveUrl) {
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
                  console.log(`✅ Updated nominator to "Nominator Live": ${item.payload.nominator.email}`);
                } else {
                  console.warn(`⚠️ Failed to update nominator to live: ${nominatorUpdateResult.error}`);
                }
              }
            }
            break;

          case 'vote_cast':
            // Sync voter with "Voters" user group
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

          case 'nominator_live_update':
            // Update nominator to "Nominator Live" with nominee link
            if (item.payload.nominatorEmail && item.payload.nomineeData) {
              syncResult = await updateNominatorToLive(
                item.payload.nominatorEmail,
                item.payload.nomineeData
              );
            }
            break;
        }

        if (syncResult.success) {
          // Mark as done
          await supabaseAdmin
            .from('loops_outbox')
            .update({ 
              status: 'done',
              last_error: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          processed++;
          console.log(`✅ Processed Loops sync item ${item.id}: ${item.event_type}`);
        } else {
          // Mark as failed, but don't mark as dead yet (allow retries)
          const shouldMarkDead = item.attempt_count >= 3;
          
          await supabaseAdmin
            .from('loops_outbox')
            .update({ 
              status: shouldMarkDead ? 'dead' : 'pending',
              last_error: syncResult.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          errors++;
          console.error(`❌ Failed to process Loops sync item ${item.id}: ${syncResult.error}`);
        }

      } catch (error) {
        // Mark as failed
        const shouldMarkDead = item.attempt_count >= 3;
        
        await supabaseAdmin
          .from('loops_outbox')
          .update({ 
            status: shouldMarkDead ? 'dead' : 'pending',
            last_error: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        errors++;
        console.error(`❌ Error processing Loops sync item ${item.id}:`, error);
      }
    }

    console.log(`🏁 Loops sync completed: ${processed} processed, ${errors} errors`);

    return NextResponse.json({
      message: 'Loops sync completed',
      processed,
      errors,
      total: pendingItems.length
    });

  } catch (error) {
    console.error('Loops sync error:', error);
    return NextResponse.json({
      error: 'Loops sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check Loops sync status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Loops sync is enabled
    if (process.env.LOOPS_SYNC_ENABLED !== 'true' || !process.env.LOOPS_API_KEY) {
      return NextResponse.json({
        enabled: false,
        message: 'Loops sync is disabled or not configured'
      });
    }

    // Test connection
    const connectionTest = await testLoopsConnection();

    // Get outbox stats
    const { data: stats } = await supabaseAdmin
      .from('loops_outbox')
      .select('status')
      .then(result => {
        if (result.error) throw result.error;
        
        const statusCounts = result.data.reduce((acc: any, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});

        return { data: statusCounts };
      });

    return NextResponse.json({
      enabled: true,
      connection: connectionTest.success ? 'healthy' : 'failed',
      connectionError: connectionTest.error,
      outboxStats: stats || {},
      apiKeyConfigured: !!process.env.LOOPS_API_KEY
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Loops sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}