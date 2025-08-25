import { NextRequest, NextResponse } from "next/server";
import { votesStore, nominationsStore } from "@/lib/storage/local-json";
import { VoteSchema } from "@/lib/validation";
import { Vote } from "@/lib/types";
import { InvalidLinkedInError } from "@/lib/errors";

export const dynamic = 'force-static';
export const revalidate = false;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "127.0.0.1"; // fallback for development
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = VoteSchema.parse(body);

    const ip = getClientIP(request);
    const ua = getUserAgent(request);

    // Check if voter has already voted in this category
    const existingVotes = await votesStore.list();
    const voterEmail = validatedData.voter.email.toLowerCase();
    
    // Check if already voted in this category
    const categoryVote = existingVotes.find(v => 
      v.voter.email.toLowerCase() === voterEmail && 
      v.category === validatedData.category
    );
    
    if (categoryVote) {
      if (categoryVote.nomineeId === validatedData.nomineeId) {
        return NextResponse.json({
          blocked: true,
          reason: "ALREADY_VOTED_FOR_THIS_NOMINEE",
          category: validatedData.category,
          nomineeId: validatedData.nomineeId,
          message: "You've already voted for this nominee."
        });
      } else {
        return NextResponse.json({
          blocked: true,
          reason: "ALREADY_VOTED_IN_CATEGORY",
          category: validatedData.category,
          message: "You've already voted in this category. Each voter can support only one nominee per category."
        });
      }
    }

    // Create and save vote
    const vote: Vote = {
      nomineeId: validatedData.nomineeId,
      category: validatedData.category,
      voter: validatedData.voter,
      ip,
      ua,
      ts: new Date().toISOString(),
    };

    await votesStore.add(vote);

    // Get updated vote count
    const updatedVotes = await votesStore.listByNominee(validatedData.nomineeId);
    const total = updatedVotes.length;

    console.log(`✅ Vote cast: ${validatedData.voter.firstName} ${validatedData.voter.lastName} voted for nominee ${validatedData.nomineeId} in ${validatedData.category}`);

    return NextResponse.json({
      success: true,
      total
    });

  } catch (error) {
    console.error("Vote creation error:", error);

    if (error instanceof InvalidLinkedInError) {
      return NextResponse.json({
        blocked: true,
        reason: "INVALID_LINKEDIN_URL",
        message: error.message
      }, { status: 400 });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nomineeId = searchParams.get("nomineeId");

    if (nomineeId) {
      const votes = await votesStore.listByNominee(nomineeId);
      return NextResponse.json(votes);
    }

    const allVotes = await votesStore.list();
    return NextResponse.json(allVotes);

  } catch (error) {
    console.error("Votes fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}