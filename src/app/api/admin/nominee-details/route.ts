import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/nominee-details - Get detailed nominee information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nomineeId = searchParams.get('nomineeId');

    if (!nomineeId) {
      return NextResponse.json(
        { error: 'nomineeId parameter is required' },
        { status: 400 }
      );
    }

    // Try to find by nominee_id first, then by nomination_id if not found
    let { data: nominee, error } = await supabaseAdmin
      .from('admin_nominations')
      .select(`
        nomination_id,
        state,
        votes,
        subcategory_id,
        category_group_id,
        admin_notes,
        rejection_reason,
        created_at,
        updated_at,
        approved_at,
        approved_by,
        nominee_id,
        nominee_type,
        nominee_firstname,
        nominee_lastname,
        nominee_email,
        nominee_linkedin,
        nominee_jobtitle,
        headshot_url,
        why_me,
        company_name,
        company_website,
        company_linkedin,
        logo_url,
        why_us,
        live_url,
        nominee_display_name,
        nominee_image_url,
        nominator_id,
        nominator_email,
        nominator_firstname,
        nominator_lastname,
        nominator_linkedin,
        nominator_company,
        nominator_job_title
      `)
      .eq('nominee_id', nomineeId)
      .single();

    // If not found by nominee_id, try by nomination_id
    if (error && error.code === 'PGRST116') {
      const result = await supabaseAdmin
        .from('admin_nominations')
        .select(`
          nomination_id,
          state,
          votes,
          subcategory_id,
          category_group_id,
          admin_notes,
          rejection_reason,
          created_at,
          updated_at,
          approved_at,
          approved_by,
          nominee_id,
          nominee_type,
          nominee_firstname,
          nominee_lastname,
          nominee_email,
          nominee_linkedin,
          nominee_jobtitle,
          headshot_url,
          why_me,
          company_name,
          company_website,
          company_linkedin,
          logo_url,
          why_us,
          live_url,
          nominee_display_name,
          nominee_image_url,
          nominator_id,
          nominator_email,
          nominator_firstname,
          nominator_lastname,
          nominator_linkedin,
          nominator_company,
          nominator_job_title
        `)
        .eq('nomination_id', nomineeId)
        .single();
      
      nominee = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Failed to get nominee details:', error);
      throw new Error(`Failed to get nominee details: ${error.message}`);
    }

    // Format the response
    const nomineeDetails = {
      id: nominee.nominee_id,
      nominationId: nominee.nomination_id,
      type: nominee.nominee_type,
      state: nominee.state,
      votes: nominee.votes,
      category: nominee.subcategory_id,
      categoryGroup: nominee.category_group_id,
      
      // Person fields
      firstname: nominee.nominee_firstname,
      lastname: nominee.nominee_lastname,
      email: nominee.nominee_email,
      linkedin: nominee.nominee_linkedin,
      jobtitle: nominee.nominee_jobtitle,
      headshotUrl: nominee.headshot_url,
      whyMe: nominee.why_me,
      
      // Company fields
      companyName: nominee.company_name,
      companyWebsite: nominee.company_website,
      companyLinkedin: nominee.company_linkedin,
      logoUrl: nominee.logo_url,
      whyUs: nominee.why_us,
      
      // Shared fields
      displayName: nominee.nominee_display_name,
      imageUrl: nominee.nominee_image_url,
      liveUrl: nominee.live_url,
      
      // Timestamps
      createdAt: nominee.created_at,
      updatedAt: nominee.updated_at,
      approvedAt: nominee.approved_at,
      approvedBy: nominee.approved_by,
      
      // Admin fields
      adminNotes: nominee.admin_notes,
      rejectionReason: nominee.rejection_reason,
      
      // Nominator info
      nominator: {
        id: nominee.nominator_id,
        email: nominee.nominator_email,
        firstname: nominee.nominator_firstname,
        lastname: nominee.nominator_lastname,
        linkedin: nominee.nominator_linkedin,
        company: nominee.nominator_company,
        jobTitle: nominee.nominator_job_title,
        displayName: `${nominee.nominator_firstname || ''} ${nominee.nominator_lastname || ''}`.trim()
      }
    };

    return NextResponse.json({
      success: true,
      data: nomineeDetails
    });

  } catch (error) {
    console.error('GET /api/admin/nominee-details error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get nominee details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/nominee-details - Update nominee details
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nomineeId, 
      whyMe, 
      whyUs, 
      headshotUrl, 
      logoUrl, 
      liveUrl,
      linkedin,
      adminNotes,
      rejectionReason
    } = body;

    if (!nomineeId) {
      return NextResponse.json(
        { error: 'nomineeId is required' },
        { status: 400 }
      );
    }

    // Update nominee data
    const nomineeUpdateData: any = {};
    if (whyMe !== undefined) nomineeUpdateData.why_me = whyMe;
    if (whyUs !== undefined) nomineeUpdateData.why_us = whyUs;
    if (headshotUrl !== undefined) nomineeUpdateData.headshot_url = headshotUrl;
    if (logoUrl !== undefined) nomineeUpdateData.logo_url = logoUrl;
    if (liveUrl !== undefined) nomineeUpdateData.live_url = liveUrl;
    if (linkedin !== undefined) nomineeUpdateData.person_linkedin = linkedin; // Use correct column name

    let nomineeData = null;
    if (Object.keys(nomineeUpdateData).length > 0) {
      const { data: updatedNominee, error: nomineeError } = await supabaseAdmin
        .from('nominees')
        .update(nomineeUpdateData)
        .eq('id', nomineeId)
        .select()
        .single();

      if (nomineeError) {
        console.error('Failed to update nominee:', nomineeError);
        throw new Error(`Failed to update nominee: ${nomineeError.message}`);
      }
      nomineeData = updatedNominee;
    }

    // Update nomination admin fields if provided
    if (adminNotes !== undefined || rejectionReason !== undefined) {
      const nominationUpdateData: any = {
        updated_at: new Date().toISOString()
      };
      if (adminNotes !== undefined) nominationUpdateData.admin_notes = adminNotes;
      if (rejectionReason !== undefined) nominationUpdateData.rejection_reason = rejectionReason;

      const { error: nominationError } = await supabaseAdmin
        .from('nominations')
        .update(nominationUpdateData)
        .eq('nominee_id', nomineeId);

      if (nominationError) {
        console.error('Failed to update nomination admin fields:', nominationError);
        // Don't throw here, nominee update succeeded
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: nomineeId,
        whyMe: nomineeData?.why_me,
        whyUs: nomineeData?.why_us,
        headshotUrl: nomineeData?.headshot_url,
        logoUrl: nomineeData?.logo_url,
        liveUrl: nomineeData?.live_url,
        linkedin: nomineeData?.person_linkedin,
        adminNotes,
        rejectionReason
      }
    });

  } catch (error) {
    console.error('PATCH /api/admin/nominee-details error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update nominee details' },
      { status: 500 }
    );
  }
}