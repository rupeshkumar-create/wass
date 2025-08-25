import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import { nominationsStore } from "@/lib/storage/local-json";
import { NominationPersonSchema, NominationCompanySchema } from "@/lib/validation";
import { buildUniqueKeyFromUrl } from "@/lib/keys";
import { CATEGORIES } from "@/lib/constants";
import { Nomination } from "@/lib/types";
import { DuplicateError, InvalidLinkedInError } from "@/lib/errors";

export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(request: NextRequest) {


  try {
    const body = await request.json();

    // Determine if this is a person or company nomination
    const categoryConfig = CATEGORIES.find(c => c.id === body.category);
    if (!categoryConfig) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate based on type
    const validationSchema = categoryConfig.type === "person"
      ? NominationPersonSchema
      : NominationCompanySchema;

    const validatedData = validationSchema.parse(body);

    // For person nominations, compute the full name from firstName and lastName
    if (categoryConfig.type === "person" && 'firstName' in validatedData.nominee && 'lastName' in validatedData.nominee) {
      validatedData.nominee.name = `${validatedData.nominee.firstName} ${validatedData.nominee.lastName}`;
    }

    // Generate unique key (LinkedIn is already normalized by validation)
    const uniqueKey = buildUniqueKeyFromUrl(validatedData.category, validatedData.nominee.linkedin);

    // Generate slug for live URL
    const baseName = validatedData.nominee.name;
    const baseSlug = slugify(baseName, { lower: true, strict: true });

    // Check for slug collisions and append number if needed
    let slug = baseSlug;
    let counter = 2;
    const allNominations = await nominationsStore.list();

    while (allNominations.some(n => n.liveUrl === `/nominee/${slug}`)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create nomination
    const nomination: Nomination = {
      id: uuidv4(),
      category: validatedData.category,
      type: categoryConfig.type,
      nominator: validatedData.nominator,
      nominee: validatedData.nominee,
      liveUrl: `/nominee/${slug}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      uniqueKey,
      whyVoteForMe: validatedData.nominee.whyVoteForMe || "",
      imageUrl: validatedData.nominee.imageUrl || "",
    };

    await nominationsStore.add(nomination);

    console.log(`✅ Nomination created: ${nomination.nominee.name} in ${nomination.category}`);

    return NextResponse.json({
      success: true,
      status: "pending",
      liveUrl: nomination.liveUrl,
      id: nomination.id
    });

  } catch (error) {
    console.error("Nomination creation error:", error);

    if (error instanceof DuplicateError) {
      return NextResponse.json({
        duplicate: true,
        reason: "A nomination already exists for this category with the same LinkedIn URL.",
        existingId: error.existing.id,
        status: error.existing.status,
        liveUrl: error.existing.liveUrl
      });
    }

    if (error instanceof InvalidLinkedInError) {
      return NextResponse.json(
        { error: "INVALID_LINKEDIN_URL", message: error.message },
        { status: 400 }
      );
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
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort");
    const limit = searchParams.get("limit");

    let nominations = await nominationsStore.list();

    // Apply filters
    if (q) {
      const query = q.toLowerCase();
      nominations = nominations.filter(n =>
        n.nominee.name.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query)
      );
    }

    if (category) {
      nominations = nominations.filter(n => n.category === category);
    }

    if (type) {
      nominations = nominations.filter(n => n.type === type);
    }

    if (status) {
      nominations = nominations.filter(n => n.status === status);
    }

    // Apply sorting
    if (sort === "recent") {
      nominations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "popular") {
      // For popular sort, we'd need to get votes and sort by vote count
      // This is a simplified version - in production you might want to optimize this
      const { votesStore } = await import("@/lib/storage/local-json");
      const votes = await votesStore.list();

      nominations.sort((a, b) => {
        const aVotes = votes.filter(v => v.nomineeId === a.id).length;
        const bVotes = votes.filter(v => v.nomineeId === b.id).length;
        return bVotes - aVotes;
      });
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        nominations = nominations.slice(0, limitNum);
      }
    }

    // Set cache headers
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "production") {
      headers["Cache-Control"] = "s-maxage=30, stale-while-revalidate=60";
    } else {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    }

    return NextResponse.json(nominations, { headers });

  } catch (error) {
    console.error("Nominations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, moderatorNote, why_vote } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Validate why_vote if provided
    if (why_vote !== undefined) {
      if (typeof why_vote !== 'string') {
        return NextResponse.json(
          { error: "why_vote must be a string" },
          { status: 400 }
        );
      }

      if (why_vote.length > 1000) {
        return NextResponse.json(
          { error: "why_vote must be 1000 characters or less" },
          { status: 400 }
        );
      }
    }

    // If approving, check for conflicts
    if (status === "approved") {
      const nomination = await nominationsStore.findById(id);
      if (!nomination) {
        return NextResponse.json(
          { error: "Nomination not found" },
          { status: 404 }
        );
      }

      // Check if another approved nomination exists with the same uniqueKey
      const conflicting = await nominationsStore.checkDuplicate(nomination.uniqueKey, id);
      if (conflicting && conflicting.status === "approved") {
        return NextResponse.json({
          conflict: true,
          reason: "Duplicate nomination exists for this category and LinkedIn URL.",
          existingId: conflicting.id,
          existingStatus: conflicting.status,
          liveUrl: conflicting.liveUrl
        }, { status: 409 });
      }
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      updateData.moderatedAt = new Date().toISOString();
    }

    if (moderatorNote) {
      updateData.moderatorNote = moderatorNote;
    }

    if (why_vote !== undefined) {
      updateData.whyVoteForMe = why_vote.trim();
    }

    await nominationsStore.update(id, updateData);

    // Get the updated nomination
    const updatedNomination = await nominationsStore.findById(id);

    if (!updatedNomination) {
      return NextResponse.json(
        { error: "Nomination not found after update" },
        { status: 404 }
      );
    }

    // Log status changes
    if (status === 'approved') {
      console.log(`✅ Nomination approved: ${updatedNomination.nominee.name} in ${updatedNomination.category}`);
    } else if (status === 'rejected') {
      console.log(`❌ Nomination rejected: ${updatedNomination.nominee.name} in ${updatedNomination.category}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedNomination
    });

  } catch (error) {
    console.error("Nomination update error:", error);

    if (error instanceof DuplicateError) {
      return NextResponse.json({
        conflict: true,
        reason: "Duplicate nomination exists for this category and LinkedIn URL.",
        existingId: error.existing.id,
        existingStatus: error.existing.status,
        liveUrl: error.existing.liveUrl
      }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}