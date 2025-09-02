import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

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

    // Try multiple lookup strategies
    let nominee = null;
    
    // Strategy 1: Direct ID lookup
    const { data: directMatch, error: directError } = await supabase
      .from('nominations')
      .select('*')
      .eq('id', identifier)
      .eq('status', 'approved')
      .single();
    
    if (directMatch && !directError) {
      nominee = directMatch;
      console.log('✅ Found by direct ID match');
    } else {
      // Strategy 2: Search by live_url path
      const { data: urlMatches, error: urlError } = await supabase
        .from('nominations')
        .select('*')
        .eq('status', 'approved')
        .like('live_url', `%${identifier}%`);
      
      if (urlMatches && urlMatches.length > 0 && !urlError) {
        nominee = urlMatches[0];
        console.log('✅ Found by live URL match');
      } else {
        // Strategy 3: Search all approved nominations and match by name/slug
        const { data: allNominees, error: allError } = await supabase
          .from('nominations')
          .select('*')
          .eq('status', 'approved');
        
        if (allNominees && !allError) {
          nominee = allNominees.find(n => {
            const nomineeData = n.nominee_data as any;
            const displayName = nomineeData?.displayName || nomineeData?.name || nomineeData?.firstName + ' ' + nomineeData?.lastName || '';
            const nameSlug = displayName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
            return nameSlug === identifier.toLowerCase();
          });
          
          if (nominee) {
            console.log('✅ Found by name slug match');
          }
        }
      }
    }

    if (!nominee) {
      console.log('❌ Nominee not found with identifier:', identifier);
      return NextResponse.json(
        { success: false, error: 'Nominee not found' },
        { status: 404 }
      );
    }
    const nomineeData = nominee.nominee_data as any;
    const companyData = nominee.company_data as any;
    const nominatorData = nominee.nominator_data as any;
    
    console.log('✅ Found nominee:', nomineeData?.displayName || nomineeData?.name);

    // Transform nominee data to match expected format
    const transformedNominee = {
      // Basic nomination info
      id: nominee.id,
      nomineeId: nominee.id,
      category: nominee.category,
      type: nominee.type,
      votes: nominee.additional_votes || 0,
      status: nominee.status,
      createdAt: nominee.created_at,
      approvedAt: nominee.moderated_at,
      uniqueKey: nominee.unique_key,

      // Display fields
      name: nomineeData?.displayName || nomineeData?.name || nomineeData?.firstName + ' ' + nomineeData?.lastName || '',
      displayName: nomineeData?.displayName || nomineeData?.name || nomineeData?.firstName + ' ' + nomineeData?.lastName || '',
      imageUrl: nominee.image_url || nomineeData?.headshotUrl || nomineeData?.logoUrl || '',
      title: nomineeData?.jobTitle || nomineeData?.title || companyData?.industry || '',
      linkedin: nomineeData?.linkedin || '',
      whyVote: nominee.why_vote_for_me || nomineeData?.whyVoteForMe || nomineeData?.whyMe || nomineeData?.whyUs || '',
      liveUrl: nominee.live_url || '',

      // Complete nominee object with ALL available form details
      nominee: {
        id: nominee.id,
        type: nominee.type,
        name: nomineeData?.displayName || nomineeData?.name || nomineeData?.firstName + ' ' + nomineeData?.lastName || '',
        displayName: nomineeData?.displayName || nomineeData?.name || nomineeData?.firstName + ' ' + nomineeData?.lastName || '',
        imageUrl: nominee.image_url || nomineeData?.headshotUrl || nomineeData?.logoUrl || '',
        
        // Contact details
        email: nomineeData?.email || '',
        phone: nomineeData?.phone || '',
        country: nomineeData?.country || '',
        linkedin: nomineeData?.linkedin || '',
        liveUrl: nominee.live_url || '',
        bio: nomineeData?.bio || '',
        achievements: nomineeData?.achievements || '',
        socialMedia: nomineeData?.socialMedia || '',

        // Person-specific fields
        ...(nominee.type === 'person' ? {
          firstName: nomineeData?.firstName || '',
          lastName: nomineeData?.lastName || '',
          jobTitle: nomineeData?.jobTitle || nomineeData?.title || '',
          title: nomineeData?.jobTitle || nomineeData?.title || '',
          jobtitle: nomineeData?.jobTitle || nomineeData?.title || '',
          company: companyData?.name || companyData?.companyName || '',
          headshotUrl: nomineeData?.headshotUrl || nominee.image_url || '',
          whyMe: nomineeData?.whyMe || nomineeData?.whyVoteForMe || '',
          whyVoteForMe: nomineeData?.whyMe || nomineeData?.whyVoteForMe || ''
        } : {}),

        // Company-specific fields  
        ...(nominee.type === 'company' ? {
          companyName: nomineeData?.name || nomineeData?.companyName || '',
          companyDomain: nomineeData?.domain || nomineeData?.companyDomain || '',
          companyWebsite: nomineeData?.website || nomineeData?.companyWebsite || '',
          website: nomineeData?.website || nomineeData?.companyWebsite || '',
          companySize: nomineeData?.size || nomineeData?.companySize || '',
          industry: nomineeData?.industry || nomineeData?.companyIndustry || '',
          logoUrl: nomineeData?.logoUrl || nominee.image_url || '',
          whyUs: nomineeData?.whyUs || nomineeData?.whyVoteForMe || '',
          whyVoteForMe: nomineeData?.whyUs || nomineeData?.whyVoteForMe || ''
        } : {}),

        // Computed fields for easy access
        whyVote: nominee.why_vote_for_me || nomineeData?.whyVoteForMe || nomineeData?.whyMe || nomineeData?.whyUs || ''
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