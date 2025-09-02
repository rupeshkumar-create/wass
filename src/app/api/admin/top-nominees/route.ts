import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/top-nominees - Get top 3 nominees by category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    // Get top 3 nominees for the specified category using admin_nominations view
    const { data: topNominees, error } = await supabaseAdmin
      .from('admin_nominations')
      .select(`
        nomination_id,
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
        votes,
        subcategory_id,
        state
      `)
      .eq('subcategory_id', category)
      .eq('state', 'approved')
      .order('votes', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Failed to get top nominees:', error);
      throw new Error(`Failed to get top nominees: ${error.message}`);
    }

    // Transform to consistent format
    const formattedNominees = topNominees.map((nominee, index) => ({
      id: nominee.nominee_id,
      nominationId: nominee.nomination_id,
      rank: index + 1,
      type: nominee.nominee_type,
      displayName: nominee.nominee_display_name,
      imageUrl: nominee.nominee_image_url,
      votes: nominee.votes,
      category: nominee.subcategory_id,
      
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
      liveUrl: nominee.live_url,
      state: nominee.state
    }));

    return NextResponse.json({
      success: true,
      data: formattedNominees,
      category,
      count: formattedNominees.length
    });

  } catch (error) {
    console.error('GET /api/admin/top-nominees error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get top nominees' },
      { status: 500 }
    );
  }
}