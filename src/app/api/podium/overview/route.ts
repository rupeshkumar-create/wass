import { NextRequest, NextResponse } from "next/server";
import { nominationsStore, votesStore } from "@/lib/storage/local-json";
import { getVoteCount } from "@/lib/votes";
import { CATEGORIES } from "@/lib/constants";
import { PodiumItem } from "../route";

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {


  try {
    // Get all approved nominations
    const allNominations = await nominationsStore.list();
    const approvedNominations = allNominations.filter(n => n.status === "approved");

    // Get all votes
    const allVotes = await votesStore.list();

    const categoryPodiums: Record<string, PodiumItem[]> = {};

    // Generate podium for each category
    for (const categoryConfig of CATEGORIES) {
      const categoryNominations = approvedNominations.filter(
        n => n.category === categoryConfig.id
      );

      // Calculate vote counts and create podium items
      const nominationsWithVotes = categoryNominations.map(nomination => {
        const voteCount = getVoteCount(allVotes, nomination.id);
        
        // Get image based on type
        let image: string | null = null;
        if (nomination.type === "person" && "headshotBase64" in nomination.nominee) {
          image = nomination.nominee.headshotBase64 || null;
        } else if (nomination.type === "company" && "logoBase64" in nomination.nominee) {
          image = nomination.nominee.logoBase64 || null;
        }

        return {
          nomineeId: nomination.id,
          name: nomination.nominee.name,
          category: nomination.category,
          type: nomination.type,
          image,
          votes: voteCount,
          liveUrl: nomination.liveUrl,
          createdAt: nomination.createdAt
        };
      });

      // Sort by votes (desc), then by createdAt (asc), then by name (asc)
      nominationsWithVotes.sort((a, b) => {
        if (a.votes !== b.votes) {
          return b.votes - a.votes; // Higher votes first
        }
        if (a.createdAt !== b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Earlier date first
        }
        return a.name.localeCompare(b.name); // Alphabetical
      });

      // Take top 3 and assign ranks
      const podiumItems: PodiumItem[] = nominationsWithVotes
        .slice(0, 3)
        .map((item, index) => ({
          rank: (index + 1) as 1 | 2 | 3,
          nomineeId: item.nomineeId,
          name: item.name,
          category: item.category,
          type: item.type,
          image: item.image,
          votes: item.votes,
          liveUrl: item.liveUrl
        }));

      categoryPodiums[categoryConfig.id] = podiumItems;
    }

    // Set cache headers
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "production") {
      headers["Cache-Control"] = "s-maxage=60, stale-while-revalidate=120";
    } else {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    }

    return NextResponse.json(categoryPodiums, { headers });

  } catch (error) {
    console.error("Podium overview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}