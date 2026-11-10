import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function retired() {
  return NextResponse.json(
    { error: { message: "Anonymous history is stored in this browser and is not available through the shared scan API.", code: "HISTORY_NOT_AVAILABLE" } },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() { return retired(); }
export async function POST() { return retired(); }
