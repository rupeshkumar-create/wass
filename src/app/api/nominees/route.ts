import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nominees - Get approved nominees with complete form details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get('subcategoryId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    console.log('Fetching nominees with params:', { subcategoryId, limit });

    // Query the public_nominees view (new schema structure)
    let query = supabase
      .from('public_nominees')
      .select('*')
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false });

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: nominees, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Found ${nominees?.length || 0} nominees`);

    // Transform nominees data from the public_nominees view
    const transformedNominees = (nominees || []).map(nominee => {
      // Safety check
      if (!nominee) {
        console.warn('Missing nominee data');
        return null;
      }
      
      // Use the computed fields from the view
      const displayName = nominee.display_name || 'Unknown';
      const imageUrl = nominee.image_url || 
                      (nominee.type === 'person' ? nominee.headshot_url : nominee.logo_url) || 
                      null;
      const email = nominee.email;
      const linkedinUrl = nominee.linkedin_url;
      const whyVote = nominee.why_vote;
      const titleOrIndustry = nominee.title_or_industry;

      return {
        // Basic nomination info
        id: nominee.nomination_id,
        nomineeId: nominee.nominee_id,
        category: nominee.subcategory_id,
        categoryGroup: nominee.category_group_id,
        type: nominee.type,
        votes: (nominee.votes || 0) + (nominee.additional_votes || 0), // Total votes (real + additional)
        status: 'approved' as const,
        createdAt: nominee.created_at,
        approvedAt: nominee.approved_at,
        uniqueKey: nominee.nomination_id,

        // Display fields
        name: displayName,
        displayName: displayName,
        imageUrl: imageUrl,
        title: titleOrIndustry,
        linkedin: linkedinUrl,
        whyVote: whyVote,
        liveUrl: nominee.website || nominee.live_url || '',

        // Complete nominee object with ALL available form details
        nominee: {
          id: nominee.nominee_id,
          type: nominee.type,
          name: displayName,
          displayName: displayName,
          imageUrl: imageUrl,
          
          // Contact details from enhanced schema
          email: email || '',
          phone: nominee.phone || '',
          country: nominee.country || '',
          linkedin: linkedinUrl || '',
          liveUrl: nominee.website || nominee.live_url || '',
          bio: nominee.bio || '',
          achievements: nominee.achievements || '',
          socialMedia: nominee.social_media || '',

          // Person-specific fields
          ...(nominee.type === 'person' ? {
            firstName: nominee.firstname || '',
            lastName: nominee.lastname || '',
            jobTitle: nominee.jobtitle || '',
            company: nominee.person_company || '',
            headshotUrl: nominee.headshot_url || imageUrl || '',
            whyMe: nominee.why_me || '',
            
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
            companySize: nominee.company_size || '',
            industry: nominee.company_industry_display || nominee.company_industry || '',
            logoUrl: nominee.logo_url || imageUrl || '',
            whyUs: nominee.why_us || '',
            
            // Enhanced field mappings
            companyEmail: nominee.company_email || '',
            companyLinkedin: nominee.company_linkedin || '',
            companyPhone: nominee.company_phone || '',
            companyCountry: nominee.company_country || '',
            companyIndustry: nominee.company_industry || ''
          } : {}),

          // Computed fields for easy access
          whyVote: whyVote || '',
          titleOrIndustry: titleOrIndustry || ''
        },

        // Legacy nominator info (anonymous in public view)
        nominator: {
          name: 'Anonymous',
          email: '',
          displayName: 'Anonymous'
        }
      };
    }).filter(Boolean); // Remove any null entries

    return NextResponse.json({
      success: true,
      data: transformedNominees,
      count: transformedNominees.length,
      message: `Found ${transformedNominees.length} approved nominees${subcategoryId ? ` in category ${subcategoryId}` : ''}`
    });

  } catch (error) {
    console.error('GET /api/nominees error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get nominees',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}