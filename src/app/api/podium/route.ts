import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase/server';
import { CATEGORIES } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export type PodiumItem = {
  rank: 1 | 2 | 3;
  nomineeId: string;
  name: string;
  category: string;
  type: "person" | "company";
  image_url: string | null;
  votes: number;
  live_slug: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }

    // Validate category exists
    const categoryConfig = CATEGORIES.find(c => c.id === category);
    if (!categoryConfig) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Get approved nominations for this category with nominee details
    const { data: nominations, error } = await supabase
      .from('nominations')
      .select(`
        id,
        nominee_id,
        subcategory_id,
        state,
        votes,
        additional_votes,
        live_url,
        approved_at,
        nominees!inner (
          id,
          type,
          firstname,
          lastname,
          company_name,
          headshot_url,
          logo_url
        )
      `)
      .eq('subcategory_id', category)
      .eq('state', 'approved');

    if (error) {
      console.error('Podium query error:', error);
      throw error;
    }

    // Sort by total votes (real + additional) and take top 3
    const sortedNominations = (nominations || [])
      .map(nomination => ({
        ...nomination,
        totalVotes: (nomination.votes || 0) + (nomination.additional_votes || 0)
      }))
      .sort((a, b) => {
        // Sort by total votes descending, then by approved_at ascending, then by name
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        if (a.approved_at && b.approved_at) {
          return new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime();
        }
        const aName = `${a.nominees?.firstname || ''} ${a.nominees?.lastname || ''}`.trim() || a.nominees?.company_name || '';
        const bName = `${b.nominees?.firstname || ''} ${b.nominees?.lastname || ''}`.trim() || b.nominees?.company_name || '';
        return aName.localeCompare(bName);
      })
      .slice(0, 3);

    // Transform to podium items
    const podiumItems: PodiumItem[] = sortedNominations.map((nomination, index) => {
      const nominee = nomination.nominees;
      
      // Generate display name
      let displayName = '';
      if (nominee?.type === 'person') {
        displayName = `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim();
        if (!displayName) displayName = 'Unknown Person';
      } else {
        displayName = nominee?.company_name || 'Unknown Company';
      }

      // Get image URL
      const imageUrl = nominee?.headshot_url || nominee?.logo_url || null;

      // Use pre-calculated total votes
      const totalVotes = nomination.totalVotes;

      // Generate live slug from live_url or create one
      let liveSlug = '';
      if (nomination.live_url) {
        // Extract slug from full URL
        const urlParts = nomination.live_url.split('/');
        liveSlug = urlParts[urlParts.length - 1] || '';
      } else {
        // Generate slug from display name
        liveSlug = displayName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      return {
        rank: (index + 1) as 1 | 2 | 3,
        nomineeId: nomination.nominee_id,
        name: displayName,
        category: nomination.subcategory_id,
        type: nominee?.type || 'person',
        image_url: imageUrl,
        votes: totalVotes,
        live_slug: liveSlug,
      };
    });

    return NextResponse.json(
      {
        category,
        items: podiumItems
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );

  } catch (error) {
    console.error("Podium API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}