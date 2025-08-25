import { NextRequest, NextResponse } from "next/server";
import { votesStore } from "@/lib/storage/local-json";

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {


  try {
    const { searchParams } = new URL(request.url);
    const nomineeId = searchParams.get("nomineeId");

    if (!nomineeId) {
      return NextResponse.json({ error: "nomineeId is required" }, { status: 400 });
    }

    const votes = await votesStore.listByNominee(nomineeId);
    const total = votes.length;

    return NextResponse.json({ 
      total,
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