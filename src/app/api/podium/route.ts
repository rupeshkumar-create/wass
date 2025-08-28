import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES } from "@/lib/constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export type PodiumItem = {
  rank: 1 | 2 | 3;
  nomineeId: string;
  name: string;
  category: string;
  type: "person" | "company";
  image_url: string | null;
  votes: number;
  live_slug: string;
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

    // Get approved nominations for this category using the new schema
    const { data: nominees, error } = await supabase
      .from('public_nominees')
      .select('*')
      .eq('subcategory_id', category)
      .order('votes', { ascending: false })
      .order('approved_at', { ascending: true })
      .order('display_name', { ascending: true })
      .limit(3);

    if (error) {
      console.error('Podium query error:', error);
      throw error;
    }

    // Transform to podium items
    const podiumItems: PodiumItem[] = (nominees || []).map((nominee, index) => ({
      rank: (index + 1) as 1 | 2 | 3,
      nomineeId: nominee.nominee_id,
      name: nominee.display_name,
      category: nominee.subcategory_id,
      type: nominee.type,
      image_url: nominee.image_url || null,
      votes: nominee.votes,
      live_slug: nominee.live_url || '',
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