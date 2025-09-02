import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Validate admin authentication
  if (!validateAdminAuth(request)) {
    return createAuthErrorResponse();
  }
  try {
    const body = await request.json();
    const { nominationId, additionalVotes } = body;

    if (!nominationId) {
      return NextResponse.json({ error: "nominationId is required" }, { status: 400 });
    }

    if (typeof additionalVotes !== 'number' || additionalVotes < 0) {
      return NextResponse.json({ error: "additionalVotes must be a non-negative number" }, { status: 400 });
    }

    // Update the additional votes for the nomination
    const { data: updatedNomination, error: updateError } = await supabaseAdmin
      .from('nominations')
      .update({ 
        additional_votes: additionalVotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', nominationId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed to update additional votes:', updateError);
      throw new Error(`Failed to update votes: ${updateError.message}`);
    }

    // Get the real vote count - FIXED: Use nomination_id instead of nominee_id
    const { count: realVotes, error: countError } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('nomination_id', nominationId);

    if (countError) {
      console.error('Failed to count real votes:', countError);
      throw new Error(`Failed to count votes: ${countError.message}`);
    }

    const totalVotes = (realVotes || 0) + additionalVotes;

    return NextResponse.json({
      success: true,
      nominationId,
      realVotes: realVotes || 0,
      additionalVotes,
      totalVotes,
      updatedNomination
    });

  } catch (error) {
    console.error("Update votes error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nominationId = searchParams.get("nominationId");

    if (!nominationId) {
      return NextResponse.json({ error: "nominationId is required" }, { status: 400 });
    }

    // Get nomination with additional votes
    const { data: nomination, error: nominationError } = await supabaseAdmin
      .from('nominations')
      .select('additional_votes')
      .eq('id', nominationId)
      .single();

    if (nominationError) {
      console.error('Failed to get nomination:', nominationError);
      throw new Error(`Failed to get nomination: ${nominationError.message}`);
    }

    // Get the real vote count - FIXED: Use nomination_id instead of nominee_id
    const { count: realVotes, error: countError } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('nomination_id', nominationId);

    if (countError) {
      console.error('Failed to count real votes:', countError);
      throw new Error(`Failed to count votes: ${countError.message}`);
    }

    const additionalVotes = nomination?.additional_votes || 0;
    const totalVotes = (realVotes || 0) + additionalVotes;

    return NextResponse.json({
      nominationId,
      realVotes: realVotes || 0,
      additionalVotes,
      totalVotes
    });

  } catch (error) {
    console.error("Get votes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}