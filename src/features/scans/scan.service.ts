import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ScanWithProduct = Prisma.ScanGetPayload<{
  include: {
    product: {
      include: {
        brand: true;
      };
    };
  };
}>;

export class ScanService {
  /**
   * Retrieves the most recent scans (with linked product + brand) for the carousel.
   */
  static async getRecentScans(limit = 10): Promise<ScanWithProduct[]> {
    return prisma.scan.findMany({
      include: {
        product: {
          include: { brand: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      where: {
        productId: { not: null },
      },
    });
  }

  /**
   * Returns a single scan with its product.
   */
  static async getScanById(id: string): Promise<ScanWithProduct | null> {
    return prisma.scan.findUnique({
      where: { id },
      include: {
        product: {
          include: { brand: true },
        },
      },
    });
  }

  /**
   * Returns all scans (paginated) for the scans list endpoint.
   */
  static async getAllScans(limit = 50): Promise<ScanWithProduct[]> {
    return prisma.scan.findMany({
      include: {
        product: {
          include: { brand: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Records a new scan (e.g., when a user views a product analysis).
   */
  static async createScan(
    productId: string,
    source: "manual" | "ocr" = "manual"
  ) {
    return prisma.scan.create({
      data: {
        productId,
        source,
      },
      include: {
        product: {
          include: { brand: true },
        },
      },
    });
  }
}
