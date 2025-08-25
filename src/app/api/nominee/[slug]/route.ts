import { NextRequest, NextResponse } from "next/server";
import { nominationsStore, votesStore } from "@/lib/storage/local-json";

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Get all nominations and votes from local storage
    const nominations = await nominationsStore.list();
    const votes = await votesStore.list();
    
    // Find nomination by slug (liveUrl)
    const nomination = nominations.find(n => 
      n.status === 'approved' && n.liveUrl === `/nominee/${slug}`
    );

    if (!nomination) {
      return NextResponse.json({ error: 'Nominee not found' }, { status: 404 });
    }

    // Count votes for this nomination
    const nominationVotes = votes.filter(v => v.nomineeId === nomination.id);

    // Transform to match expected structure
    const nominee = {
      id: nomination.id,
      category: nomination.category,
      type: nomination.type,
      nominee: {
        name: nomination.nominee.name,
        title: 'title' in nomination.nominee ? nomination.nominee.title : undefined,
        country: nomination.nominee.country,
        website: 'website' in nomination.nominee ? nomination.nominee.website : undefined,
        linkedin: nomination.nominee.linkedin,
        imageUrl: nomination.nominee.imageUrl,
      },
      liveUrl: nomination.liveUrl,
      status: nomination.status,
      createdAt: nomination.createdAt,
      votes: nominationVotes.length,
      whyVoteForMe: nomination.whyVoteForMe
    };

    return NextResponse.json(nominee, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('Error in nominee API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}