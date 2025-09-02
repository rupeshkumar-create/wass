import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAuth } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats - Get dashboard statistics with real-time vote counts
 * Returns different data based on admin authentication
 */
export async function GET(request: NextRequest) {
  const isAdmin = validateAdminAuth(request);
  try {
    // Use admin_nominations view for consistent data
    const { data: nominations, error: nominationsError } = await supabaseAdmin
      .from('admin_nominations')
      .select('nomination_id, state, subcategory_id, votes, additional_votes');

    if (nominationsError) {
      throw new Error(`Failed to get nominations: ${nominationsError.message}`);
    }

    // Get unique voters count
    const { data: voters, error: votersError } = await supabaseAdmin
      .from('voters')
      .select('id', { count: 'exact' });

    if (votersError) {
      throw new Error(`Failed to get voters: ${votersError.message}`);
    }

    // Calculate vote statistics using the same logic as admin panel
    let totalRealVotes = 0;
    let totalAdditionalVotes = 0;
    let totalCombinedVotes = 0;

    nominations.forEach(nomination => {
      const realVotes = nomination.votes || 0;
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
      
      const realVotes = nomination.votes || 0;
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
        // Admin view - full breakdown with separate vote counts
        totalNominations,
        pendingNominations,
        approvedNominations,
        rejectedNominations,
        
        // Vote statistics (admin only - separate counts)
        totalRealVotes,
        totalAdditionalVotes,
        totalCombinedVotes,
        totalVotes: totalCombinedVotes, // For consistency with public API
        uniqueVoters,
        
        // Calculated metrics
        averageVotesPerNominee: totalNominations > 0 ? Math.round(totalCombinedVotes / totalNominations) : 0,
        averageRealVotesPerNominee: totalNominations > 0 ? Math.round(totalRealVotes / totalNominations) : 0,
        
        // Category breakdown (admin gets full breakdown)
        byCategory,
        
        // Additional insights (admin only)
        nominationsWithAdditionalVotes: nominations.filter(n => (n.additional_votes || 0) > 0).length,
        percentageAdditionalVotes: totalCombinedVotes > 0 ? Math.round((totalAdditionalVotes / totalCombinedVotes) * 100) : 0
      } : {
        // Public view - ONLY combined votes (no breakdown)
        totalNominations,
        approvedNominations,
        totalVotes: totalCombinedVotes, // ONLY show combined total
        uniqueVoters,
        
        // Basic metrics
        averageVotesPerNominee: totalNominations > 0 ? Math.round(totalCombinedVotes / totalNominations) : 0,
        
        // Category breakdown (public version - only combined votes)
        byCategory: Object.fromEntries(
          Object.entries(byCategory).map(([category, data]) => [
            category,
            {
              nominees: data.nominees,
              votes: data.totalVotes // Only combined votes for public
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