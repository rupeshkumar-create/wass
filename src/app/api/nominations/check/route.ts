import { NextRequest, NextResponse } from "next/server";
import { nominationsStore } from "@/lib/storage/local-json";
import { buildUniqueKeyFromUrl } from "@/lib/keys";
import { InvalidLinkedInError } from "@/lib/errors";

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {


  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const linkedin = searchParams.get("linkedin");

    if (!category || !linkedin) {
      return NextResponse.json(
        { error: "Category and LinkedIn URL are required" },
        { status: 400 }
      );
    }

    const uniqueKey = buildUniqueKeyFromUrl(category, linkedin);
    const existing = await nominationsStore.findByUniqueKey(uniqueKey);

    if (existing) {
      return NextResponse.json({
        exists: true,
        existingId: existing.id,
        status: existing.status,
        liveUrl: existing.liveUrl
      });
    }

    return NextResponse.json({
      exists: false
    });

  } catch (error) {
    console.error("Check nomination error:", error);
    
    if (error instanceof InvalidLinkedInError) {
      return NextResponse.json(
        { error: "INVALID_LINKEDIN_URL", message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}