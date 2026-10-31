import { Prisma } from "@prisma/client";
import { OpenFoodFactsClient } from "./open-food-facts.client";
import { normalizeOpenFoodFactsProduct } from "./open-food-facts.normalizer";
import { ProductIngestionRepository } from "./product-ingestion.repository";
import { IncompleteOpenFoodFactsProductError } from "./open-food-facts.types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class ProductIngestionService {
  constructor(
    private readonly client = new OpenFoodFactsClient(),
    private readonly repository = new ProductIngestionRepository(),
  ) {}

  async lookupByBarcode(barcode: string) {
    const cached = await this.repository.getFreshByBarcode(barcode, CACHE_TTL_MS);
    if (cached) return cached;

    const external = await this.client.getProductByBarcode(barcode);
    let normalized;
    try {
      normalized = normalizeOpenFoodFactsProduct(external, barcode);
    } catch {
      throw new IncompleteOpenFoodFactsProductError();
    }
    return this.repository.persist(normalized, external as Prisma.InputJsonValue, barcode);
  }
}

export const productIngestionService = new ProductIngestionService();
