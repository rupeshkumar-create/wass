import { NextRequest, NextResponse } from "next/server";
import { nominationsStore, votesStore } from "@/lib/storage/local-json";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort") || "votes_desc";

    console.log(`🔍 NOMINEES API - Request params:`, { category, type, q, limit, sort });

    // Get all nominations and votes from local storage
    const nominations = await nominationsStore.list();
    const votes = await votesStore.list();

    // Only include approved nominations
    const approvedNominations = nominations.filter(n => n.status === 'approved');

    console.log(`🔍 NOMINEES API - Retrieved ${approvedNominations.length} approved nominees from local storage`);

    // Apply filtering
    let filteredData = approvedNominations;

    // Filter by category
    if (category) {
      console.log(`🔍 NOMINEES API - Filtering by category: "${category}"`);
      const beforeCount = filteredData.length;
      filteredData = filteredData.filter(nomination => nomination.category === category);
      console.log(`🔍 NOMINEES API - Category filter result: ${filteredData.length} (was ${beforeCount})`);
    }

    // Filter by type
    if (type) {
      console.log(`🔍 NOMINEES API - Filtering by type: "${type}"`);
      const beforeCount = filteredData.length;
      filteredData = filteredData.filter(nomination => nomination.type === type);
      console.log(`🔍 NOMINEES API - Type filter result: ${filteredData.length} (was ${beforeCount})`);
    }

    // Filter by search query
    if (q) {
      console.log(`🔍 NOMINEES API - Filtering by search: "${q}"`);
      const beforeCount = filteredData.length;
      filteredData = filteredData.filter(nomination =>
        nomination.nominee.name?.toLowerCase().includes(q.toLowerCase()) ||
        nomination.category?.toLowerCase().includes(q.toLowerCase())
      );
      console.log(`🔍 NOMINEES API - Search filter result: ${filteredData.length} (was ${beforeCount})`);
    }

    // Calculate vote counts for each nomination
    const nominationsWithVotes = filteredData.map(nomination => {
      const nominationVotes = votes.filter(v => v.nomineeId === nomination.id);
      return {
        ...nomination,
        votes: nominationVotes.length
      };
    });

    // Apply sorting
    switch (sort) {
      case "votes_asc":
        nominationsWithVotes.sort((a, b) => a.votes - b.votes || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "newest":
        nominationsWithVotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        nominationsWithVotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "name":
        nominationsWithVotes.sort((a, b) => (a.nominee.name || '').localeCompare(b.nominee.name || ''));
        break;
      default: // votes_desc
        nominationsWithVotes.sort((a, b) => b.votes - a.votes || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    filteredData = nominationsWithVotes;

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (limitNum > 0) {
        filteredData = filteredData.slice(0, limitNum);
      }
    }

    console.log(`🔍 NOMINEES API - Final result: ${filteredData.length} nominees`);

    return NextResponse.json(filteredData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Debug-Category': category || 'none',
        'X-Debug-Results': filteredData.length.toString(),
        'X-Debug-Total': approvedNominations.length.toString(),
        'X-Debug-Timestamp': new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('🔍 NOMINEES API - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}