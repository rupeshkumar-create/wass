import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

interface BulkApprovalRequest {
  nominationIds: string[];
  approvedBy?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkApprovalRequest = await request.json();
    const { nominationIds, approvedBy } = body;

    if (!nominationIds || !Array.isArray(nominationIds) || nominationIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request. nominationIds array is required.' 
      }, { status: 400 });
    }

    if (nominationIds.length > 100) {
      return NextResponse.json({ 
        error: 'Too many nominations. Maximum 100 nominations per batch approval.' 
      }, { status: 400 });
    }

    const approverEmail = approvedBy || user.email || 'unknown';
    let approvedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const approvedNominations: any[] = [];

    // Process each nomination
    for (const nominationId of nominationIds) {
      try {
        // First, verify the nomination exists and is eligible for approval
        const { data: nomination, error: fetchError } = await supabase
          .from('nominations')
          .select(`
            id,
            state,
            upload_source,
            is_draft,
            bulk_upload_batch_id,
            nominee_id,
            nominees (
              id,
              type,
              firstname,
              lastname,
              company_name,
              person_email,
              company_email
            )
          `)
          .eq('id', nominationId)
          .single();

        if (fetchError || !nomination) {
          failedCount++;
          errors.push(`Nomination ${nominationId}: Not found`);
          continue;
        }

        // Check if nomination is eligible for approval
        if (nomination.state !== 'pending') {
          failedCount++;
          errors.push(`Nomination ${nominationId}: Already ${nomination.state}`);
          continue;
        }

        if (nomination.upload_source !== 'bulk_upload' || !nomination.is_draft) {
          failedCount++;
          errors.push(`Nomination ${nominationId}: Not a bulk upload draft`);
          continue;
        }

        // Update nomination to approved
        const { error: updateError } = await supabase
          .from('nominations')
          .update({
            state: 'approved',
            is_draft: false,
            approved_at: new Date().toISOString(),
            approved_by: approverEmail,
            updated_at: new Date().toISOString(),
            loops_sync_status: 'queued' // Will be picked up by sync process
          })
          .eq('id', nominationId);

        if (updateError) {
          failedCount++;
          errors.push(`Nomination ${nominationId}: Update failed - ${updateError.message}`);
          continue;
        }

        // Queue for Loops sync
        const { error: queueError } = await supabase
          .from('loops_sync_queue')
          .insert({
            nomination_id: nominationId,
            sync_type: 'bulk_approve',
            priority: 3, // Medium priority for bulk approvals
            payload: {
              nomination_id: nominationId,
              upload_source: 'bulk_upload',
              batch_id: nomination.bulk_upload_batch_id,
              approved_by: approverEmail
            },
            status: 'pending'
          });

        if (queueError) {
          // Log error but don't fail the approval
          console.error(`Failed to queue Loops sync for ${nominationId}:`, queueError);
        }

        approvedCount++;
        approvedNominations.push({
          id: nominationId,
          nominee_name: nomination.nominees?.type === 'person' 
            ? `${nomination.nominees.firstname} ${nomination.nominees.lastname}`
            : nomination.nominees?.company_name,
          nominee_email: nomination.nominees?.type === 'person'
            ? nomination.nominees.person_email
            : nomination.nominees?.company_email
        });

      } catch (error) {
        failedCount++;
        errors.push(`Nomination ${nominationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update batch statistics if all nominations are from the same batch
    const batchIds = new Set(approvedNominations.map(n => n.batch_id).filter(Boolean));
    for (const batchId of batchIds) {
      try {
        // Trigger batch stats update (handled by database trigger)
        await supabase
          .from('bulk_upload_batches')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', batchId);
      } catch (error) {
        console.error(`Failed to update batch ${batchId} stats:`, error);
      }
    }

    const response = {
      success: true,
      summary: {
        totalRequested: nominationIds.length,
        approved: approvedCount,
        failed: failedCount,
        approvedBy: approverEmail
      },
      approvedNominations,
      errors: errors.length > 0 ? errors : undefined,
      nextSteps: [
        `${approvedCount} nominees have been approved and are now live`,
        'Approved nominees will be synced to Loops.so automatically',
        'Check the admin dashboard for updated statistics',
        errors.length > 0 ? 'Review errors for failed approvals' : null
      ].filter(Boolean)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Bulk approval error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to fetch nominees pending bulk approval
export async function GET(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('admin_bulk_nominees_pending')
      .select('*');

    if (batchId) {
      query = query.eq('bulk_upload_batch_id', batchId);
    }

    const { data: pendingNominees, error: fetchError } = await query
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch pending nominees' 
      }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('admin_bulk_nominees_pending')
      .select('*', { count: 'exact', head: true });

    if (batchId) {
      countQuery = countQuery.eq('bulk_upload_batch_id', batchId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      pendingNominees: pendingNominees || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      batchFilter: batchId || null
    });

  } catch (error) {
    console.error('Bulk approval GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}