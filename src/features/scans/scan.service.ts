import { PrismaClient, Prisma } from "@prisma/client";
import { ProductSummary } from "../products/product.types";

const prisma = new PrismaClient();

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
   * Retrieves the most recent scans for the carousel.
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
      // Only return scans that have an associated product for now
      where: {
        productId: { not: null },
      },
    });
  }

  /**
   * Records a new scan (e.g., when a user views a product analysis).
   */
  static async createScan(productId: string, source: "manual" | "ocr" = "manual") {
    return prisma.scan.create({
      data: {
        productId,
        source,
      },
    });
  }
}
