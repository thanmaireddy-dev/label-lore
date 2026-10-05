import { NextResponse } from "next/server";
import { ScanService } from "@/features/scans/scan.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scans = await ScanService.getRecentScans(10);
    return NextResponse.json({ data: scans });
  } catch (error) {
    console.error("Recent Scans API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch recent scans", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
