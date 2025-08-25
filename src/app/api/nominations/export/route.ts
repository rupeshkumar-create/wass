import { NextRequest, NextResponse } from "next/server";
import { nominationsStore } from "@/lib/storage/local-json";
import { nominationsToCsv } from "@/lib/csv";

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(request: NextRequest) {


  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let nominations = await nominationsStore.list();

    // Apply same filters as main API
    if (category) {
      nominations = nominations.filter(n => n.category === category);
    }

    if (type) {
      nominations = nominations.filter(n => n.type === type);
    }

    if (status) {
      nominations = nominations.filter(n => n.status === status);
    }

    const csv = nominationsToCsv(nominations);
    const filename = `nominations-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}