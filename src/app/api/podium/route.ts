import { NextRequest, NextResponse } from "next/server";
import { nominationsStore, votesStore } from "@/lib/storage/local-json";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export type PodiumItem = {
  rank: 1 | 2 | 3;
  nomineeId: string;
  name: string;
  category: string;
  type: "person" | "company";
  image: string | null;
  votes: number;
  liveUrl: string;
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

    // Get all nominations and votes from local storage
    const nominations = await nominationsStore.list();
    const votes = await votesStore.list();
    
    // Filter approved nominations for this category
    const categoryNominations = nominations.filter(n => 
      n.status === 'approved' && n.category === category
    );

    // Calculate vote counts and sort
    const nominationsWithVotes = categoryNominations.map(nomination => {
      const nominationVotes = votes.filter(v => v.nomineeId === nomination.id);
      return {
        ...nomination,
        voteCount: nominationVotes.length
      };
    });

    // Sort by votes (desc), then by creation date (asc), then by name (asc)
    nominationsWithVotes.sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      if (a.createdAt !== b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.nominee.name.localeCompare(b.nominee.name);
    });

    // Get top 3
    const top3 = nominationsWithVotes.slice(0, 3);

    // Transform to podium items
    const podiumItems: PodiumItem[] = top3.map((nomination, index) => ({
      rank: (index + 1) as 1 | 2 | 3,
      nomineeId: nomination.id,
      name: nomination.nominee.name,
      category: nomination.category,
      type: nomination.type,
      image: nomination.nominee.imageUrl || null,
      votes: nomination.voteCount,
      liveUrl: nomination.liveUrl,
    }));

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