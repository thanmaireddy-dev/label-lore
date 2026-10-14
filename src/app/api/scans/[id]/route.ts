import { NextRequest, NextResponse } from "next/server";
import { ScanService } from "@/features/scans/scan.service";

/**
 * GET /api/scans/[id]
 * Returns a single scan by ID, including its linked product and brand.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scan = await ScanService.getScanById(id);

    if (!scan) {
      return NextResponse.json(
        { error: { message: "Scan not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: scan });
  } catch (error) {
    console.error("Scan by ID API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch scan", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
