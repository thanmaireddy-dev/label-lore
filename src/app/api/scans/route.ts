import { NextRequest, NextResponse } from "next/server";
import { ScanService } from "@/features/scans/scan.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/scans
 * Returns paginated scan history.
 * Query params:
 *   limit: number (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam ?? "50", 10) || 50, 100);

    const scans = await ScanService.getAllScans(limit);
    return NextResponse.json({ data: scans, count: scans.length });
  } catch (error) {
    console.error("Scans list API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch scans", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

const CreateScanSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  source: z.enum(["manual", "ocr"]).default("manual"),
});

/**
 * POST /api/scans
 * Records a new scan event.
 * Body: { productId: string, source?: "manual" | "ocr" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateScanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid request body",
            code: "VALIDATION_ERROR",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { productId, source } = parsed.data;
    const scan = await ScanService.createScan(productId, source);

    return NextResponse.json({ data: scan }, { status: 201 });
  } catch (error) {
    console.error("Create Scan API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to create scan", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
