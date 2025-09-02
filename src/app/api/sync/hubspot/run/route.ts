import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase/client';
import { 
  syncNominatorToHubSpot, 
  syncNomineeToHubSpot, 
  syncVoterToHubSpot,
  testHubSpotRealTimeSync,
  setupHubSpotCustomProperties
} from '@/server/hubspot/realtime-sync';

// Secret header for cron job protection
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Simple health check for HubSpot connection
    const { testHubSpotRealTimeSync } = await import('@/server/hubspot/realtime-sync');
    const testResult = await testHubSpotRealTimeSync();
    
    return NextResponse.json({
      status: 'connected',
      message: 'HubSpot API is accessible',
      ...testResult
    });
  } catch (error) {
    console.error('HubSpot health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'HubSpot connection failed'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for CRON secret or admin authentication
    const cronSecret = request.headers.get('x-cron-secret');
    const adminUser = request.headers.get('x-admin-user');
    const syncSecret = request.headers.get('x-sync-secret');
    
    if (!cronSecret && !adminUser && !syncSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin or CRON authentication required' },
        { status: 401 }
      );
    }
    
    if (cronSecret && cronSecret !== CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid CRON secret' },
        { status: 401 }
      );
    }
    
    if (syncSecret && syncSecret !== process.env.SYNC_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid sync secret' },
        { status: 401 }
      );
    }
    
    const body = await request.json().catch(() => ({}));
    
    // Handle test requests
    if (body.test || body.action === 'test') {
      console.log('🔍 Testing HubSpot connection...');
      const testResult = await testHubSpotRealTimeSync();
      return NextResponse.json(testResult);
    }

    // Handle setup properties request
    if (body.action === 'setup' || body.action === 'setup-properties') {
      console.log('🔧 Setting up HubSpot custom properties...');
      const setupResult = await setupHubSpotCustomProperties();
      return NextResponse.json(setupResult);
    }

    // Handle individual sync tests (bypass auth for testing)
    if (body.action === 'sync_nominator' && body.data) {
      console.log('🧪 Testing nominator sync...');
      const result = await syncNominatorToHubSpot(body.data);
      return NextResponse.json(result);
    }

    if (body.action === 'sync_nominee' && body.data) {
      console.log('🧪 Testing nominee sync...');
      const result = await syncNomineeToHubSpot(body.data);
      return NextResponse.json(result);
    }

    if (body.action === 'sync_voter' && body.data) {
      console.log('🧪 Testing voter sync...');
      const result = await syncVoterToHubSpot(body.data);
      return NextResponse.json(result);
    }

    if (body.action === 'batch_sync' && body.data) {
      console.log('🧪 Testing batch sync...');
      const { batchSyncToHubSpot } = await import('@/server/hubspot/realtime-sync');
      const result = await batchSyncToHubSpot(body.data);
      return NextResponse.json(result);
    }

    if (body.action === 'get_contact' && body.contactId) {
      console.log('🔍 Fetching contact details...');
      const { hubspotClient } = await import('@/server/hubspot/client');
      const contactData = await hubspotClient.hubFetch(`/crm/v3/objects/contacts/${body.contactId}?properties=wsa_contact_tag,wsa_tags,wsa_role,firstname,lastname,email`);
      return NextResponse.json(contactData);
    }

    // Check authorization for production sync
    const cronKey = request.headers.get('x-cron-key');
    if (cronKey !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`Processing up to ${limit} HubSpot sync items...`);

    // 1. Claim N pending rows (status='pending' → 'processing')
    const { data: pendingItems, error: fetchError } = await supabaseAdmin
      .from('hubspot_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) throw fetchError;

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json({
        message: 'No pending sync items',
        processed: 0
      });
    }

    console.log(`Found ${pendingItems.length} pending items to process`);

    // 2. Mark items as processing
    const itemIds = pendingItems.map(item => item.id);
    
    // Update each item individually to increment attempt_count
    for (const item of pendingItems) {
      const { error: itemUpdateError } = await supabaseAdmin
        .from('hubspot_outbox')
        .update({ 
          status: 'processing',
          attempt_count: item.attempt_count + 1
        })
        .eq('id', item.id);
      
      if (itemUpdateError) {
        console.error(`Failed to update item ${item.id}:`, itemUpdateError);
        throw itemUpdateError;
      }
    }

    // 3. Process each item (SKELETON ONLY - no HubSpot calls yet)
    const results = [];
    
    for (const item of pendingItems) {
      try {
        console.log(`Processing ${item.event_type} for item ${item.id}`);
        
        // Real-time HubSpot sync logic
        switch (item.event_type) {
          case 'nomination_submitted':
            console.log('Syncing nomination_submitted to HubSpot:', item.payload.nominationId);
            
            const nominatorSyncData = {
              firstname: item.payload.nominator.firstname,
              lastname: item.payload.nominator.lastname,
              email: item.payload.nominator.email,
              linkedin: item.payload.nominator.linkedin,
              company: item.payload.nominator.company,
              jobTitle: item.payload.nominator.jobTitle,
              phone: item.payload.nominator.phone,
              country: item.payload.nominator.country,
            };

            const nominatorResult = await syncNominatorToHubSpot(nominatorSyncData);
            if (!nominatorResult.success) {
              throw new Error(`Nominator sync failed: ${nominatorResult.error}`);
            }
            
            console.log('✅ Nominator synced to HubSpot:', nominatorResult.contactId);
            break;
            
          case 'nomination_approved':
            console.log('Syncing nomination_approved to HubSpot:', item.payload.nominationId);
            
            const nomineeSyncData = {
              type: item.payload.type as 'person' | 'company',
              subcategoryId: item.payload.subcategoryId,
              nominationId: item.payload.nominationId,
              // Person fields
              firstname: item.payload.nominee?.firstname,
              lastname: item.payload.nominee?.lastname,
              email: item.payload.nominee?.person_email || item.payload.nominee?.email,
              linkedin: item.payload.nominee?.person_linkedin || item.payload.nominee?.linkedin,
              jobtitle: item.payload.nominee?.jobtitle,
              company: item.payload.nominee?.person_company || item.payload.nominee?.company,
              phone: item.payload.nominee?.person_phone,
              country: item.payload.nominee?.person_country,
              // Company fields
              companyName: item.payload.nominee?.company_name || item.payload.nominee?.name,
              companyWebsite: item.payload.nominee?.company_website || item.payload.nominee?.website,
              companyLinkedin: item.payload.nominee?.company_linkedin,
              companyEmail: item.payload.nominee?.company_email,
              companyPhone: item.payload.nominee?.company_phone,
              companyCountry: item.payload.nominee?.company_country,
              companyIndustry: item.payload.nominee?.company_industry,
              companySize: item.payload.nominee?.company_size,
            };

            const nomineeResult = await syncNomineeToHubSpot(nomineeSyncData);
            if (!nomineeResult.success) {
              throw new Error(`Nominee sync failed: ${nomineeResult.error}`);
            }
            
            console.log('✅ Nominee synced to HubSpot:', nomineeResult.contactId);
            break;
            
          case 'vote_cast':
            console.log('Syncing vote_cast to HubSpot:', item.payload.voterId);
            
            const voterSyncData = {
              firstname: item.payload.voter.firstname,
              lastname: item.payload.voter.lastname,
              email: item.payload.voter.email,
              linkedin: item.payload.voter.linkedin,
              company: item.payload.voter.company,
              jobTitle: item.payload.voter.job_title,
              phone: item.payload.voter.phone,
              country: item.payload.voter.country,
              votedFor: item.payload.votedForDisplayName,
              subcategoryId: item.payload.subcategoryId,
            };

            const voterResult = await syncVoterToHubSpot(voterSyncData);
            if (!voterResult.success) {
              throw new Error(`Voter sync failed: ${voterResult.error}`);
            }
            
            console.log('✅ Voter synced to HubSpot:', voterResult.contactId);
            break;
            
          default:
            throw new Error(`Unknown event type: ${item.event_type}`);
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mark as done (for now, since we're not actually calling HubSpot)
        const { error: doneError } = await supabaseAdmin
          .from('hubspot_outbox')
          .update({ status: 'done' })
          .eq('id', item.id);

        if (doneError) throw doneError;

        results.push({
          id: item.id,
          event_type: item.event_type,
          status: 'done'
        });

      } catch (itemError) {
        console.error(`Failed to process item ${item.id}:`, itemError);
        
        // Mark as dead if too many attempts, otherwise back to pending
        const newStatus = item.attempt_count >= 3 ? 'dead' : 'pending';
        
        const { error: failError } = await supabaseAdmin
          .from('hubspot_outbox')
          .update({ 
            status: newStatus,
            last_error: itemError instanceof Error ? itemError.message : 'Unknown error'
          })
          .eq('id', item.id);

        if (failError) {
          console.error(`Failed to update error status for item ${item.id}:`, failError);
        }

        results.push({
          id: item.id,
          event_type: item.event_type,
          status: 'failed',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'done').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`HubSpot sync completed: ${successCount} succeeded, ${failedCount} failed`);

    return NextResponse.json({
      processed: results.length,
      succeeded: successCount,
      failed: failedCount,
      results
    });

  } catch (error) {
    console.error('POST /api/sync/hubspot/run error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process sync'
      },
      { status: 500 }
    );
  }
}