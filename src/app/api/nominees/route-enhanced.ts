import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nominees - Get approved nominees with complete form details
 * This version works with the enhanced schema after running CORRECTED_SCHEMA_FOR_CURRENT_STRUCTURE.sql
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get('subcategoryId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    console.log('Fetching nominees with params:', { subcategoryId, limit });

    // Try to use the enhanced view first, fallback to direct table query
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

    let { data: nominees, error } = await query;

    // If view doesn't exist, fallback to direct table query
    if (error && error.message.includes('does not exist')) {
      console.log('View not found, using direct table query...');
      
      let fallbackQuery = supabase
        .from('nominations')
        .select('*')
        .eq('state', 'approved')
        .order('votes', { ascending: false })
        .order('created_at', { ascending: false });

      if (subcategoryId) {
        fallbackQuery = fallbackQuery.eq('subcategory_id', subcategoryId);
      }

      if (limit) {
        fallbackQuery = fallbackQuery.limit(limit);
      }

      const fallbackResult = await fallbackQuery;
      nominees = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Found ${nominees?.length || 0} nominees`);

    // Transform nominees data (works with both view and direct table)
    const transformedNominees = (nominees || []).map(nominee => {
      // Safety check
      if (!nominee) {
        console.warn('Missing nominee data');
        return null;
      }
      
      // Handle both view format and direct table format
      const isViewFormat = nominee.display_name !== undefined;
      
      const displayName = isViewFormat 
        ? nominee.display_name 
        : (nominee.type === 'person'
          ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
          : nominee.company_name || 'Unknown');
      
      const imageUrl = isViewFormat 
        ? nominee.image_url 
        : (nominee.type === 'person' ? nominee.headshot_url : nominee.logo_url);
      
      const email = isViewFormat 
        ? nominee.email 
        : (nominee.type === 'person' ? nominee.person_email : nominee.company_email);
      
      const phone = isViewFormat 
        ? nominee.phone 
        : (nominee.type === 'person' ? nominee.person_phone : nominee.company_phone);
      
      const country = isViewFormat 
        ? nominee.country 
        : (nominee.type === 'person' ? nominee.person_country : nominee.company_country);
      
      const linkedinUrl = isViewFormat 
        ? nominee.linkedin_url 
        : (nominee.type === 'person' ? nominee.person_linkedin : nominee.company_linkedin);
      
      const whyVote = isViewFormat 
        ? nominee.why_vote 
        : (nominee.type === 'person' ? nominee.why_me : nominee.why_us);
      
      const titleOrIndustry = isViewFormat 
        ? nominee.title_or_industry 
        : (nominee.type === 'person' ? nominee.jobtitle : nominee.company_industry);

      return {
        // Basic nomination info
        id: nominee.nomination_id || nominee.id,
        nomineeId: nominee.nominee_id || nominee.id,
        category: nominee.subcategory_id,
        categoryGroup: nominee.category_group_id,
        type: nominee.nominee_type || nominee.type,
        votes: nominee.votes || 0,
        status: 'approved' as const,
        createdAt: nominee.created_at,
        approvedAt: nominee.approved_at || nominee.updated_at,
        uniqueKey: nominee.nomination_id || nominee.id,

        // Display fields
        name: displayName,
        displayName: displayName,
        imageUrl: imageUrl,
        title: titleOrIndustry,
        linkedin: linkedinUrl,
        whyVote: whyVote,
        liveUrl: nominee.live_url || '',

        // Complete nominee object with ALL form details
        nominee: {
          id: nominee.nominee_id || nominee.id,
          type: nominee.nominee_type || nominee.type,
          name: displayName,
          displayName: displayName,
          imageUrl: imageUrl,
          
          // Contact details (now available with enhanced schema)
          email: email || '',
          phone: phone || '',
          country: country || '',
          linkedin: linkedinUrl || '',
          liveUrl: nominee.live_url || '',
          bio: nominee.bio || '',
          achievements: nominee.achievements || '',
          socialMedia: nominee.social_media || '',

          // Person-specific fields
          ...((nominee.nominee_type || nominee.type) === 'person' ? {
            firstName: nominee.firstname || '',
            lastName: nominee.lastname || '',
            jobTitle: nominee.jobtitle || '',
            company: nominee.person_company || '',
            headshotUrl: nominee.headshot_url || '',
            whyMe: nominee.why_me || '',
            
            // Legacy field mappings for compatibility
            personEmail: nominee.person_email || '',
            personLinkedin: nominee.person_linkedin || '',
            personPhone: nominee.person_phone || '',
            personCountry: nominee.person_country || '',
            personCompany: nominee.person_company || ''
          } : {}),

          // Company-specific fields  
          ...((nominee.nominee_type || nominee.type) === 'company' ? {
            companyName: nominee.company_name || '',
            companyDomain: nominee.company_domain || '',
            companyWebsite: nominee.company_website || '',
            companySize: nominee.company_size || '',
            industry: nominee.company_industry || '',
            logoUrl: nominee.logo_url || '',
            whyUs: nominee.why_us || '',
            
            // Legacy field mappings for compatibility
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
      message: `Found ${transformedNominees.length} approved nominees${subcategoryId ? ` in category ${subcategoryId}` : ''}`,
      usingEnhancedSchema: !error // Indicates if enhanced schema is available
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