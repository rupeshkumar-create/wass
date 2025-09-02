import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/nominations - Get all nominations for admin panel
 */
export async function GET(request: NextRequest) {
  // Validate admin authentication
  if (!validateAdminAuth(request)) {
    return createAuthErrorResponse();
  }
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('admin_nominations')
      .select(`
        nomination_id,
        state,
        votes,
        additional_votes,
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
        nominee_person_email,
        nominee_person_linkedin,
        nominee_person_phone,
        nominee_jobtitle,
        nominee_person_company,
        nominee_person_country,
        nominee_headshot_url,
        nominee_why_me,
        nominee_company_name,
        nominee_company_website,
        nominee_company_linkedin,
        nominee_company_email,
        nominee_company_phone,
        nominee_company_country,
        nominee_logo_url,
        nominee_why_us,
        nominee_live_url,
        nominee_display_name,
        nominee_image_url,
        nominee_email,
        nominee_phone,
        nominator_id,
        nominator_email,
        nominator_firstname,
        nominator_lastname,
        nominator_linkedin,
        nominator_company,
        nominator_job_title,
        nominator_phone,
        nominator_country
      `);

    if (status) {
      query = query.eq('state', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: nominations, error } = await query;

    if (error) {
      console.error('Failed to get admin nominations:', error);
      throw new Error(`Failed to get nominations: ${error.message}`);
    }

    // Transform to admin-friendly format (matching frontend expectations)
    const adminNominations = nominations.map(nom => ({
      id: nom.nomination_id,
      type: nom.nominee_type,
      state: nom.state,
      categoryGroupId: nom.category_group_id,
      subcategoryId: nom.subcategory_id,
      subcategory_id: nom.subcategory_id, // Frontend expects this
      
      // Person fields
      firstname: nom.nominee_firstname,
      lastname: nom.nominee_lastname,
      jobtitle: nom.nominee_jobtitle,
      personEmail: nom.nominee_person_email,
      personLinkedin: nom.nominee_person_linkedin,
      personPhone: nom.nominee_person_phone,
      personCompany: nom.nominee_person_company,
      personCountry: nom.nominee_person_country,
      headshotUrl: nom.nominee_headshot_url,
      headshot_url: nom.nominee_headshot_url, // Frontend expects this
      whyMe: nom.nominee_why_me,
      
      // Company fields
      companyName: nom.nominee_company_name,
      company_name: nom.nominee_company_name, // Frontend expects this
      companyWebsite: nom.nominee_company_website,
      companyLinkedin: nom.nominee_company_linkedin,
      companyEmail: nom.nominee_company_email,
      companyPhone: nom.nominee_company_phone,
      companyCountry: nom.nominee_company_country,
      logoUrl: nom.nominee_logo_url,
      logo_url: nom.nominee_logo_url, // Frontend expects this
      whyUs: nom.nominee_why_us,
      
      // Shared fields
      liveUrl: nom.nominee_live_url,
      votes: nom.votes, // Real votes from actual voting
      additionalVotes: nom.additional_votes || 0, // Manual votes added by admin
      totalVotes: (nom.votes || 0) + (nom.additional_votes || 0), // Total for display
      createdAt: nom.created_at,
      created_at: nom.created_at, // Frontend expects this
      updatedAt: nom.updated_at,
      
      // Contact info (computed)
      email: nom.nominee_email,
      phone: nom.nominee_phone,
      linkedin: nom.nominee_type === 'person' ? nom.nominee_person_linkedin : nom.nominee_company_linkedin,
      
      // Nominator info
      nominatorEmail: nom.nominator_email,
      nominatorName: `${nom.nominator_firstname || ''} ${nom.nominator_lastname || ''}`.trim(),
      nominatorCompany: nom.nominator_company,
      nominatorJobTitle: nom.nominator_job_title,
      nominatorPhone: nom.nominator_phone,
      nominatorCountry: nom.nominator_country,
      
      // Computed fields
      displayName: nom.nominee_display_name,
      imageUrl: nom.nominee_image_url,
      
      // Admin fields
      adminNotes: nom.admin_notes,
      rejectionReason: nom.rejection_reason,
      approvedAt: nom.approved_at,
      approvedBy: nom.approved_by
    }));

    return NextResponse.json({
      success: true,
      data: adminNominations,
      count: adminNominations.length
    });

  } catch (error) {
    console.error('GET /api/admin/nominations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get nominations' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/nominations - Update nomination status or details
 */
export async function PATCH(request: NextRequest) {
  // Validate admin authentication
  if (!validateAdminAuth(request)) {
    return createAuthErrorResponse();
  }
  
  try {
    const body = await request.json();
    const { nominationId, state, liveUrl, whyMe, whyUs, headshotUrl, logoUrl, linkedin, adminNotes, rejectionReason } = body;

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

    // Get current nomination data to check if we need to auto-generate URL
    const { data: currentNomination, error: fetchError } = await supabaseAdmin
      .from('admin_nominations')
      .select('nomination_id, state, nominee_type, nominee_display_name, nominee_live_url')
      .eq('nomination_id', nominationId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch nomination: ${fetchError.message}`);
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields that are provided
    if (state) {
      updateData.state = state;
      
      // Auto-generate live URL when approving if not already set
      if (state === 'approved' && !currentNomination.nominee_live_url && liveUrl === undefined) {
        const displayName = currentNomination.nominee_display_name || `nominee-${nominationId}`;
        const slug = displayName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Get base URL - always use localhost for development
        let baseUrl = 'http://localhost:3000';
        
        // Only use production URLs if explicitly in production
        if (process.env.NODE_ENV === 'production') {
          if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
          } else if (process.env.NEXT_PUBLIC_SITE_URL) {
            baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          }
        }
        
        updateData.live_url = `${baseUrl}/nominee/${slug}`;
        console.log(`Auto-generated live URL: ${updateData.live_url} for ${displayName}`);
      }
    }
    
    if (liveUrl !== undefined) {
      // Ensure live URL follows consistent format
      const cleanUrl = liveUrl.trim();
      if (cleanUrl && !cleanUrl.startsWith('http')) {
        // If it's just a slug, create full URL
        let baseUrl = 'http://localhost:3000';
        
        // Only use production URLs if explicitly in production
        if (process.env.NODE_ENV === 'production') {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'https://worldstaffingawards.com');
        }
        
        updateData.live_url = `${baseUrl}/nominee/${cleanUrl}`;
      } else {
        updateData.live_url = cleanUrl;
      }
    }
    if (adminNotes !== undefined) updateData.admin_notes = adminNotes;
    if (rejectionReason !== undefined) updateData.rejection_reason = rejectionReason;

    // Update the nomination
    const { data: nominationData, error: nominationError } = await supabaseAdmin
      .from('nominations')
      .update(updateData)
      .eq('id', nominationId)
      .select('id, state, nominee_id, updated_at, live_url')
      .single();

    if (nominationError) {
      console.error('Failed to update nomination:', nominationError);
      throw new Error(`Failed to update nomination: ${nominationError.message}`);
    }

    // Update nominee data if provided
    const nomineeUpdateData: any = {};
    // Note: live_url is stored in nominations table, not nominees table
    if (whyMe !== undefined) nomineeUpdateData.why_me = whyMe;
    if (whyUs !== undefined) nomineeUpdateData.why_us = whyUs;
    if (headshotUrl !== undefined) nomineeUpdateData.headshot_url = headshotUrl;
    if (logoUrl !== undefined) nomineeUpdateData.logo_url = logoUrl;
    if (linkedin !== undefined) {
      // Update the appropriate LinkedIn field based on nominee type
      const { data: nominee } = await supabaseAdmin
        .from('nominees')
        .select('type')
        .eq('id', nominationData.nominee_id)
        .single();
      
      if (nominee?.type === 'person') {
        nomineeUpdateData.person_linkedin = linkedin;
      } else {
        nomineeUpdateData.company_linkedin = linkedin;
      }
    }

    let nomineeData = null;
    if (Object.keys(nomineeUpdateData).length > 0) {
      const { data: updatedNominee, error: nomineeError } = await supabaseAdmin
        .from('nominees')
        .update(nomineeUpdateData)
        .eq('id', nominationData.nominee_id)
        .select()
        .single();

      if (nomineeError) {
        console.error('Failed to update nominee:', nomineeError);
        // Don't throw here, nomination update succeeded
      } else {
        nomineeData = updatedNominee;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: nominationData.id,
        state: nominationData.state,
        liveUrl: nomineeData?.live_url,
        whyMe: nomineeData?.why_me,
        whyUs: nomineeData?.why_us,
        headshotUrl: nomineeData?.headshot_url,
        logoUrl: nomineeData?.logo_url,
        linkedin: nomineeData?.person_linkedin,
        adminNotes,
        rejectionReason,
        updatedAt: nominationData.updated_at
      }
    });

  } catch (error) {
    console.error('PATCH /api/admin/nominations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update nomination' },
      { status: 500 }
    );
  }
}