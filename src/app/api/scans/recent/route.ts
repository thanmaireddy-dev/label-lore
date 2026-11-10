import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: { message: "Anonymous history is stored in this browser and is not available through the shared scan API.", code: "HISTORY_NOT_AVAILABLE" } },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
