import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/auth/admin';

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
 * GET /api/stats - Get dashboard statistics with real-time vote counts
 * Returns different data based on admin authentication
 */
export async function GET(request: NextRequest) {
  const isAdmin = validateAdminAuth(request);
  try {
    // Get nominations with additional votes
    const { data: nominations, error: nominationsError } = await supabaseAdmin
      .from('nominations')
      .select('id, state, subcategory_id, additional_votes');

    if (nominationsError) {
      throw new Error(`Failed to get nominations: ${nominationsError.message}`);
    }

    // Get real votes count by nomination
    const { data: votesByNomination, error: votesError } = await supabaseAdmin
      .from('votes')
      .select('nomination_id')
      .then(result => {
        if (result.error) return result;
        
        // Count votes per nomination
        const voteCounts: Record<string, number> = {};
        result.data.forEach(vote => {
          voteCounts[vote.nomination_id] = (voteCounts[vote.nomination_id] || 0) + 1;
        });
        
        return { data: voteCounts, error: null };
      });

    if (votesError) {
      throw new Error(`Failed to get votes: ${votesError.message}`);
    }

    // Get total votes count
    const { data: allVotes, error: allVotesError } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact' });

    if (allVotesError) {
      throw new Error(`Failed to get total votes: ${allVotesError.message}`);
    }

    // Get unique voters count
    const { data: voters, error: votersError } = await supabaseAdmin
      .from('voters')
      .select('id', { count: 'exact' });

    if (votersError) {
      throw new Error(`Failed to get voters: ${votersError.message}`);
    }

    // Calculate vote statistics
    let totalRealVotes = 0;
    let totalAdditionalVotes = 0;
    let totalCombinedVotes = 0;

    nominations.forEach(nomination => {
      const realVotes = votesByNomination[nomination.id] || 0;
      const additionalVotes = nomination.additional_votes || 0;
      
      totalRealVotes += realVotes;
      totalAdditionalVotes += additionalVotes;
      totalCombinedVotes += realVotes + additionalVotes;
    });

    // Calculate basic stats
    const totalNominations = nominations.length;
    const pendingNominations = nominations.filter(n => n.state === 'submitted').length;
    const approvedNominations = nominations.filter(n => n.state === 'approved').length;
    const rejectedNominations = nominations.filter(n => n.state === 'rejected').length;
    const uniqueVoters = voters?.length || 0;

    // Group by category with vote breakdown
    const byCategory: Record<string, { 
      nominees: number; 
      realVotes: number; 
      additionalVotes: number; 
      totalVotes: number; 
    }> = {};
    
    nominations.forEach(nomination => {
      const category = nomination.subcategory_id;
      if (!byCategory[category]) {
        byCategory[category] = { nominees: 0, realVotes: 0, additionalVotes: 0, totalVotes: 0 };
      }
      
      const realVotes = votesByNomination[nomination.id] || 0;
      const additionalVotes = nomination.additional_votes || 0;
      
      byCategory[category].nominees++;
      byCategory[category].realVotes += realVotes;
      byCategory[category].additionalVotes += additionalVotes;
      byCategory[category].totalVotes += realVotes + additionalVotes;
    });

    // Return different data based on admin authentication
    const stats = {
      success: true,
      data: isAdmin ? {
        // Admin view - full breakdown
        totalNominations,
        pendingNominations,
        approvedNominations,
        rejectedNominations,
        
        // Vote statistics (admin only)
        totalRealVotes,
        totalAdditionalVotes,
        totalCombinedVotes,
        uniqueVoters,
        
        // Calculated metrics
        averageVotesPerNominee: totalNominations > 0 ? Math.round(totalCombinedVotes / totalNominations) : 0,
        averageRealVotesPerNominee: totalNominations > 0 ? Math.round(totalRealVotes / totalNominations) : 0,
        
        // Category breakdown
        byCategory,
        
        // Additional insights (admin only)
        nominationsWithAdditionalVotes: nominations.filter(n => (n.additional_votes || 0) > 0).length,
        percentageAdditionalVotes: totalCombinedVotes > 0 ? Math.round((totalAdditionalVotes / totalCombinedVotes) * 100) : 0
      } : {
        // Public view - combined votes only
        totalNominations,
        approvedNominations,
        totalVotes: totalCombinedVotes, // Only combined votes for public
        totalCombinedVotes: totalCombinedVotes, // Also include this for backward compatibility
        uniqueVoters,
        
        // Basic metrics
        averageVotesPerNominee: totalNominations > 0 ? Math.round(totalCombinedVotes / totalNominations) : 0,
        
        // Category breakdown (public version - only total votes)
        byCategory: Object.fromEntries(
          Object.entries(byCategory).map(([category, data]) => [
            category,
            {
              nominees: data.nominees,
              votes: data.totalVotes // Only show combined votes
            }
          ])
        )
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