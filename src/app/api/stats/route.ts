import { NextRequest, NextResponse } from "next/server";
import { nominationsStore, votesStore } from "@/lib/storage/local-json";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {


  try {
    // Get all nominations and votes from local storage
    const nominations = await nominationsStore.list();
    const votes = await votesStore.list();
    
    // Filter approved nominations
    const approvedNominations = nominations.filter(n => n.status === 'approved');
    const pendingNominations = nominations.filter(n => n.status === 'pending');
    
    const totalNominations = approvedNominations.length;
    const totalVotes = votes.length;
    
    // Group by category
    const byCategory = approvedNominations.reduce((acc: Record<string, { nominees: number; votes: number }>, nomination) => {
      if (!acc[nomination.category]) {
        acc[nomination.category] = { nominees: 0, votes: 0 };
      }
      acc[nomination.category].nominees++;
      
      // Count votes for this nomination
      const nominationVotes = votes.filter(v => v.nomineeId === nomination.id);
      acc[nomination.category].votes += nominationVotes.length;
      
      return acc;
    }, {});

    const stats = {
      totalNominees: totalNominations,
      totalVotes,
      byCategory,
      pendingNominations: pendingNominations.length
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}