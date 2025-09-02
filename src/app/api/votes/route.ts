import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/votes - Get all votes for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get("subcategoryId");

    let query = supabaseAdmin
      .from('votes')
      .select(`
        id,
        subcategory_id,
        vote_timestamp,
        created_at,
        voter_id,
        nomination_id,
        voters!inner (
          email,
          firstname,
          lastname,
          linkedin
        ),
        nominations!inner (
          nominees!inner (
            type,
            firstname,
            lastname,
            company_name
          )
        )
      `);

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    query = query.order('vote_timestamp', { ascending: false });

    const { data: votesData, error } = await query;

    if (error) {
      console.error('Failed to get votes:', error);
      throw new Error(`Failed to get votes: ${error.message}`);
    }

    // Transform to match expected format for admin dashboard
    const votes = votesData.map(vote => ({
      id: vote.id,
      category: vote.subcategory_id,
      voter: {
        firstName: vote.voters.firstname,
        lastName: vote.voters.lastname,
        email: vote.voters.email,
        linkedin: vote.voters.linkedin
      },
      votedFor: vote.nominations.nominees.type === 'person' 
        ? `${vote.nominations.nominees.firstname || ''} ${vote.nominations.nominees.lastname || ''}`.trim()
        : vote.nominations.nominees.company_name || '',
      createdAt: vote.vote_timestamp || vote.created_at
    }));

    return NextResponse.json(votes);

  } catch (error) {
    console.error("GET /api/votes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get votes" },
      { status: 500 }
    );
  }
}