import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/nominees/[id] - Get specific nominee by flexible identifier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params;
    
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Nominee identifier is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking for nominee with identifier:', identifier);

    // Use the flexible lookup function from the database
    const { data: nominees, error } = await supabase
      .rpc('get_nominee_by_identifier', { identifier })
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!nominees || nominees.length === 0) {
      console.log('❌ Nominee not found');
      return NextResponse.json(
        { success: false, error: 'Nominee not found' },
        { status: 404 }
      );
    }

    const nominee = nominees[0];
    console.log('✅ Found nominee:', nominee.display_name);

    // Transform nominee data to match expected format
    const transformedNominee = {
      // Basic nomination info
      id: nominee.nomination_id,
      nomineeId: nominee.nominee_id,
      category: nominee.subcategory_id,
      categoryGroup: nominee.category_group_id,
      type: nominee.type,
      votes: nominee.total_votes || 0, // Use total votes (real + additional)
      status: 'approved' as const,
      createdAt: nominee.created_at,
      approvedAt: nominee.approved_at,
      uniqueKey: nominee.nomination_id,

      // Display fields
      name: nominee.display_name,
      displayName: nominee.display_name,
      imageUrl: nominee.image_url,
      title: nominee.title_or_industry,
      linkedin: nominee.linkedin_url,
      whyVote: nominee.why_vote,
      liveUrl: nominee.live_url,

      // Complete nominee object with ALL available form details
      nominee: {
        id: nominee.nominee_id,
        type: nominee.type,
        name: nominee.display_name,
        displayName: nominee.display_name,
        imageUrl: nominee.image_url,
        
        // Contact details
        email: nominee.person_email || '',
        phone: nominee.person_phone || nominee.company_phone || '',
        country: nominee.person_country || nominee.company_country || '',
        linkedin: nominee.linkedin_url || '',
        liveUrl: nominee.live_url || '',
        bio: nominee.bio || '',
        achievements: nominee.achievements || '',
        socialMedia: nominee.social_media || '',

        // Person-specific fields
        ...(nominee.type === 'person' ? {
          firstName: nominee.firstname || '',
          lastName: nominee.lastname || '',
          jobTitle: nominee.title_or_industry || '',
          title: nominee.title_or_industry || '',
          jobtitle: nominee.title_or_industry || '',
          company: nominee.person_company || '',
          headshotUrl: nominee.headshot_url || '',
          whyMe: nominee.why_me || '',
          whyVoteForMe: nominee.why_me || '',
          
          // Enhanced field mappings
          personEmail: nominee.person_email || '',
          personLinkedin: nominee.person_linkedin || '',
          personPhone: nominee.person_phone || '',
          personCountry: nominee.person_country || '',
          personCompany: nominee.person_company || ''
        } : {}),

        // Company-specific fields  
        ...(nominee.type === 'company' ? {
          companyName: nominee.company_name || '',
          companyDomain: nominee.company_domain || '',
          companyWebsite: nominee.company_website || '',
          website: nominee.company_website || '',
          companySize: nominee.company_size || '',
          industry: nominee.company_industry || '',
          logoUrl: nominee.logo_url || '',
          whyUs: nominee.why_us || '',
          whyVoteForMe: nominee.why_us || '',
          
          // Enhanced field mappings
          companyEmail: nominee.person_email || '', // In case company uses person_email
          companyLinkedin: nominee.company_linkedin || '',
          companyPhone: nominee.company_phone || '',
          companyCountry: nominee.company_country || '',
          companyIndustry: nominee.company_industry || ''
        } : {}),

        // Computed fields for easy access
        whyVote: nominee.why_vote || '',
        titleOrIndustry: nominee.title_or_industry || ''
      },

      // Legacy nominator info (anonymous in public view)
      nominator: {
        name: 'Anonymous',
        email: '',
        displayName: 'Anonymous'
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedNominee,
      message: `Found nominee: ${nominee.display_name}`
    });

  } catch (error) {
    console.error('GET /api/nominees/[id] error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get nominee',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}