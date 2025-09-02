import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nominationId = searchParams.get("nominationId");
    const nomineeId = searchParams.get("nomineeId");

    if (!nominationId && !nomineeId) {
      return NextResponse.json({ error: "nominationId or nomineeId is required" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact' });

    if (nominationId) {
      query = query.eq('nomination_id', nominationId);
    } else if (nomineeId) {
      // If using nomineeId, we need to join with nominations to get the nomination_id
      const { data: nominations } = await supabaseAdmin
        .from('nominations')
        .select('id')
        .eq('nominee_id', nomineeId);
      
      if (nominations && nominations.length > 0) {
        const nominationIds = nominations.map(n => n.id);
        query = query.in('nomination_id', nominationIds);
      } else {
        return NextResponse.json({ total: 0, nomineeId });
      }
    }

    const { count, error } = await query;

    if (error) {
      console.error('Failed to count votes:', error);
      throw new Error(`Failed to count votes: ${error.message}`);
    }

    return NextResponse.json({ 
      total: count || 0,
      nominationId,
      nomineeId
    });

  } catch (error) {
    console.error("Vote count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}