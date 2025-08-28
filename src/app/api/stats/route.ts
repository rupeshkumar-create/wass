import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats - Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get nominations stats
    const { data: nominations, error: nominationsError } = await supabaseAdmin
      .from('nominations')
      .select('id, state, subcategory_id, votes');

    if (nominationsError) {
      throw new Error(`Failed to get nominations: ${nominationsError.message}`);
    }

    // Get votes stats (count actual votes, not voters)
    const { data: votes, error: votesError } = await supabaseAdmin
      .from('votes')
      .select('id, subcategory_id, voter_id');

    if (votesError) {
      throw new Error(`Failed to get votes: ${votesError.message}`);
    }

    // Get unique voters count
    const { data: voters, error: votersError } = await supabaseAdmin
      .from('voters')
      .select('id');

    if (votersError) {
      throw new Error(`Failed to get voters: ${votersError.message}`);
    }

    // Calculate stats
    const totalNominations = nominations.length;
    const pendingNominations = nominations.filter(n => n.state === 'submitted').length;
    const approvedNominations = nominations.filter(n => n.state === 'approved').length;
    const totalVotes = votes.length; // Count actual votes cast
    const uniqueVoters = voters.length;

    // Group by category
    const byCategory: Record<string, { nominees: number; votes: number }> = {};
    
    nominations.forEach(nomination => {
      const category = nomination.subcategory_id;
      if (!byCategory[category]) {
        byCategory[category] = { nominees: 0, votes: 0 };
      }
      byCategory[category].nominees++;
      byCategory[category].votes += nomination.votes || 0;
    });

    const stats = {
      success: true,
      data: {
        totalNominations,
        pendingNominations,
        approvedNominations,
        totalVotes,
        uniqueVoters,
        byCategory,
        averageVotesPerNominee: totalNominations > 0 ? Math.round(totalVotes / totalNominations) : 0
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 }
    );
  }
}