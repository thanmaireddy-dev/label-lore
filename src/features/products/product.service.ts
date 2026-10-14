import { prisma } from "@/lib/prisma";
import { ProductWithDetails, ProductSummary } from "./product.types";

export class ProductService {
  /**
   * Retrieves a full product by ID, including its brand, ingredients, nutrition, and claims.
   */
  static async getProductById(id: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        nutrition: true,
        ingredients: {
          include: { ingredient: true },
          orderBy: { order: "asc" },
        },
        claims: {
          include: { claim: true },
        },
      },
    });
  }

  /**
   * Searches for products by name or brand (case-insensitive where supported).
   */
  static async searchProducts(query: string): Promise<ProductSummary[]> {
    if (!query || query.trim() === "") {
      return [];
    }

    const searchTerm = query.trim();

    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { brand: { name: { contains: searchTerm } } },
          { category: { contains: searchTerm } },
        ],
      },
      include: {
        brand: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });
  }

  /**
   * Gets a paginated list of all products for browsing.
   */
  static async getAllProducts(limit = 50): Promise<ProductSummary[]> {
    return prisma.product.findMany({
      include: { brand: true },
      take: limit,
      orderBy: { name: "asc" },
    });
  }
}
