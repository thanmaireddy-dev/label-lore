import { prisma } from "@/lib/prisma";
import type { ProductSearchRecord, ProductSummary, ProductWithDetails } from "./product.types";

const productDetails = {
  brand: true,
  category: true,
  sourceRecords: { include: { source: true }, orderBy: { retrievedAt: "desc" as const } },
  nutrition: true,
  ingredients: { include: { ingredient: { include: { additive: true } } }, orderBy: { order: "asc" as const } },
  claims: { include: { claim: true } },
};

export class ProductRepository {
  static getById(id: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({ where: { id }, include: productDetails });
  }

  static search(query: string, limit = 10): Promise<ProductSearchRecord[]> {
    const searchTerm = query.trim();
    if (!searchTerm) return Promise.resolve([]);
    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { brand: { is: { name: { contains: searchTerm, mode: "insensitive" } } } },
          { category: { is: { name: { contains: searchTerm, mode: "insensitive" } } } },
        ],
      },
      include: { brand: true, category: true, identifiers: { where: { scheme: "GTIN" }, select: { value: true } } },
      take: limit,
      orderBy: { name: "asc" },
    });
  }

  static list(limit = 50): Promise<ProductSummary[]> {
    return prisma.product.findMany({
      include: { brand: true, category: true },
      take: limit,
      orderBy: { name: "asc" },
    });
  }
}
