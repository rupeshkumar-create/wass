import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/nominations-improved - Get all nominations with complete data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Use the admin_nominations view for complete data
    let query = supabaseAdmin
      .from('admin_nominations')
      .select('*');

    if (status) {
      query = query.eq('state', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: nominations, error } = await query;

    if (error) {
      console.error('Failed to get admin nominations:', error);
      throw new Error(`Failed to get nominations: ${error.message}`);
    }

    // Transform to admin-friendly format
    const adminNominations = nominations.map(nom => ({
      id: nom.nomination_id,
      type: nom.nominee_type,
      state: nom.state,
      categoryGroupId: nom.category_group_id,
      subcategoryId: nom.subcategory_id,
      subcategory_id: nom.subcategory_id, // Frontend expects this
      
      // Nominee data
      nomineeId: nom.nominee_id,
      firstname: nom.nominee_firstname,
      lastname: nom.nominee_lastname,
      jobtitle: nom.nominee_jobtitle,
      personEmail: nom.nominee_person_email,
      personLinkedin: nom.nominee_person_linkedin,
      headshotUrl: nom.nominee_headshot_url,
      headshot_url: nom.nominee_headshot_url, // Frontend expects this
      whyMe: nom.nominee_why_me,
      
      companyName: nom.nominee_company_name,
      company_name: nom.nominee_company_name, // Frontend expects this
      companyWebsite: nom.nominee_company_website,
      companyLinkedin: nom.nominee_company_linkedin,
      logoUrl: nom.nominee_logo_url,
      logo_url: nom.nominee_logo_url, // Frontend expects this
      whyUs: nom.nominee_why_us,
      
      liveUrl: nom.nominee_live_url,
      votes: nom.votes || 0, // Real votes
      additionalVotes: nom.additional_votes || 0, // Manual votes
      createdAt: nom.created_at,
      created_at: nom.created_at, // Frontend expects this
      updatedAt: nom.updated_at,
      approvedAt: nom.approved_at,
      approvedBy: nom.approved_by,
      adminNotes: nom.admin_notes,
      rejectionReason: nom.rejection_reason,
      
      // Nominator data
      nominatorId: nom.nominator_id,
      nominatorEmail: nom.nominator_email,
      nominatorFirstname: nom.nominator_firstname,
      nominatorLastname: nom.nominator_lastname,
      nominatorName: `${nom.nominator_firstname || ''} ${nom.nominator_lastname || ''}`.trim(),
      nominatorLinkedin: nom.nominator_linkedin,
      nominatorCompany: nom.nominator_company,
      nominatorJobTitle: nom.nominator_job_title,
      
      // Computed fields for display
      displayName: nom.nominee_display_name || (nom.nominee_type === 'person' 
        ? `${nom.nominee_firstname || ''} ${nom.nominee_lastname || ''}`.trim()
        : nom.nominee_company_name || 'Unknown'
      ),
      imageUrl: nom.nominee_image_url || (nom.nominee_type === 'person' 
        ? nom.nominee_headshot_url 
        : nom.nominee_logo_url
      )
    }));

    return NextResponse.json({
      success: true,
      data: adminNominations,
      count: adminNominations.length
    });

  } catch (error) {
    console.error('GET /api/admin/nominations-improved error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get nominations' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/nominations-improved - Update nomination status or details
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nominationId, 
      state, 
      adminNotes, 
      rejectionReason,
      approvedBy,
      // Nominee updates
      liveUrl, 
      whyMe, 
      whyUs, 
      headshotUrl, 
      logoUrl,
      bio,
      achievements
    } = body;

    if (!nominationId) {
      return NextResponse.json(
        { error: 'Missing nominationId' },
        { status: 400 }
      );
    }

    // If state is provided, validate it
    if (state && !['submitted', 'approved', 'rejected'].includes(state)) {
      return NextResponse.json(
        { error: 'Invalid state. Must be submitted, approved, or rejected' },
        { status: 400 }
      );
    }

    // Get the nomination to find the nominee
    const { data: nomination, error: nomError } = await supabaseAdmin
      .from('nominations')
      .select('nominee_id, state')
      .eq('id', nominationId)
      .single();

    if (nomError) {
      throw new Error(`Failed to find nomination: ${nomError.message}`);
    }

    // Update nomination
    const nominationUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (state) {
      nominationUpdates.state = state;
      if (state === 'approved') {
        nominationUpdates.approved_at = new Date().toISOString();
        nominationUpdates.approved_by = approvedBy || 'admin';
      } else if (state === 'rejected') {
        nominationUpdates.rejection_reason = rejectionReason;
      }
    }

    if (adminNotes !== undefined) nominationUpdates.admin_notes = adminNotes;

    const { data: updatedNomination, error: updateError } = await supabaseAdmin
      .from('nominations')
      .update(nominationUpdates)
      .eq('id', nominationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update nomination: ${updateError.message}`);
    }

    // Update nominee if provided
    const nomineeUpdates: any = {};
    let hasNomineeUpdates = false;

    if (liveUrl !== undefined) {
      nomineeUpdates.live_url = liveUrl;
      hasNomineeUpdates = true;
    }
    if (whyMe !== undefined) {
      nomineeUpdates.why_me = whyMe;
      hasNomineeUpdates = true;
    }
    if (whyUs !== undefined) {
      nomineeUpdates.why_us = whyUs;
      hasNomineeUpdates = true;
    }
    if (headshotUrl !== undefined) {
      nomineeUpdates.headshot_url = headshotUrl;
      hasNomineeUpdates = true;
    }
    if (logoUrl !== undefined) {
      nomineeUpdates.logo_url = logoUrl;
      hasNomineeUpdates = true;
    }
    if (bio !== undefined) {
      nomineeUpdates.bio = bio;
      hasNomineeUpdates = true;
    }
    if (achievements !== undefined) {
      nomineeUpdates.achievements = achievements;
      hasNomineeUpdates = true;
    }

    if (hasNomineeUpdates) {
      const { error: nomineeError } = await supabaseAdmin
        .from('nominees')
        .update(nomineeUpdates)
        .eq('id', nomination.nominee_id);

      if (nomineeError) {
        console.warn('Failed to update nominee:', nomineeError);
        // Don't fail the whole operation for nominee updates
      }
    }

    // Add to HubSpot outbox if approved
    if (state === 'approved' && nomination.state !== 'approved') {
      const outboxPayload = {
        nominationId: updatedNomination.id,
        nomineeId: nomination.nominee_id,
        state: 'approved',
        approvedAt: updatedNomination.approved_at,
        approvedBy: updatedNomination.approved_by
      };

      const { error: outboxError } = await supabaseAdmin
        .from('hubspot_outbox')
        .insert({
          event_type: 'nomination_approved',
          payload: outboxPayload
        });

      if (outboxError) {
        console.warn('Failed to add to HubSpot outbox:', outboxError);
        // Don't fail the nomination for this
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedNomination.id,
        state: updatedNomination.state,
        adminNotes: updatedNomination.admin_notes,
        rejectionReason: updatedNomination.rejection_reason,
        approvedAt: updatedNomination.approved_at,
        approvedBy: updatedNomination.approved_by,
        updatedAt: updatedNomination.updated_at
      }
    });

  } catch (error) {
    console.error('PATCH /api/admin/nominations-improved error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update nomination' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/nominations-improved - Delete a nomination (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nominationId = searchParams.get('id');

    if (!nominationId) {
      return NextResponse.json(
        { error: 'Missing nomination ID' },
        { status: 400 }
      );
    }

    // Get nomination details before deletion for cleanup
    const { data: nomination, error: fetchError } = await supabaseAdmin
      .from('nominations')
      .select('nominee_id, state')
      .eq('id', nominationId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    // Delete the nomination (this will cascade to related records)
    const { error: deleteError } = await supabaseAdmin
      .from('nominations')
      .delete()
      .eq('id', nominationId);

    if (deleteError) {
      throw new Error(`Failed to delete nomination: ${deleteError.message}`);
    }

    // Also delete the nominee if no other nominations reference it
    const { data: otherNominations } = await supabaseAdmin
      .from('nominations')
      .select('id')
      .eq('nominee_id', nomination.nominee_id);

    if (!otherNominations || otherNominations.length === 0) {
      // Safe to delete the nominee as well
      await supabaseAdmin
        .from('nominees')
        .delete()
        .eq('id', nomination.nominee_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Nomination deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/admin/nominations-improved error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete nomination' },
      { status: 500 }
    );
  }
}

