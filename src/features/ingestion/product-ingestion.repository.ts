import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NormalizedFoodProduct } from "./open-food-facts.types";

const SOURCE_KEY = "open_food_facts";
const productDetails = {
  brand: true,
  category: true,
  nutrition: true,
  ingredients: { include: { ingredient: { include: { additive: true } } }, orderBy: { order: "asc" as const } },
  claims: { include: { claim: true } },
};

export class ProductIngestionRepository {
  async getFreshByBarcode(barcode: string, maxAgeMs: number) {
    const identifier = await prisma.productIdentifier.findUnique({
      where: { scheme_value: { scheme: "GTIN", value: barcode } },
      include: { product: { include: productDetails } },
    });
    if (!identifier) return null;
    const source = await prisma.foodSource.findUnique({ where: { key: SOURCE_KEY } });
    if (!source) return null;
    const record = await prisma.productSourceRecord.findFirst({
      where: { productId: identifier.productId, sourceId: source.id },
      orderBy: { retrievedAt: "desc" },
      select: { retrievedAt: true },
    });
    return record && Date.now() - record.retrievedAt.getTime() < maxAgeMs ? identifier.product : null;
  }
  async persist(normalized: NormalizedFoodProduct, rawPayload: Prisma.InputJsonValue, barcode: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const source = await tx.foodSource.upsert({
          where: { key: SOURCE_KEY },
          create: {
            key: SOURCE_KEY,
            name: "Open Food Facts",
            baseUrl: "https://world.openfoodfacts.org",
            license: "ODbL-1.0; product images may have separate CC BY-SA licensing",
            attribution: "Product data from Open Food Facts; community-contributed and unverified",
          },
          update: {},
        });
        let product = await tx.product.findFirst({
          where: { identifiers: { some: { scheme: "GTIN", value: barcode } } },
        });
        if (!product) {
          const brand = normalized.brandName
            ? await tx.brand.upsert({ where: { name: normalized.brandName }, create: { name: normalized.brandName }, update: {} })
            : null;
          const category = normalized.categoryName
            ? await tx.category.upsert({ where: { name: normalized.categoryName }, create: { name: normalized.categoryName }, update: {} })
            : null;
          product = await tx.product.create({
            data: {
              name: normalized.name,
              brandId: brand?.id ?? null,
              categoryId: category?.id ?? null,
              imageUrl: normalized.imageUrl,
              packageSize: normalized.packageSize,
              allergensText: normalized.allergensText,
              missingFields: normalized.missingFields,
              verificationStatus: "UNVERIFIED",
              identifiers: { create: { scheme: "GTIN", value: barcode } },
            },
          });
        } else {
          const [brand, category] = await Promise.all([
            product.brandId || !normalized.brandName ? null : tx.brand.upsert({ where: { name: normalized.brandName }, create: { name: normalized.brandName }, update: {} }),
            product.categoryId || !normalized.categoryName ? null : tx.category.upsert({ where: { name: normalized.categoryName }, create: { name: normalized.categoryName }, update: {} }),
          ]);
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              ...(brand ? { brandId: brand.id } : {}),
              ...(category ? { categoryId: category.id } : {}),
              ...(!product.imageUrl && normalized.imageUrl ? { imageUrl: normalized.imageUrl } : {}),
              ...(!product.packageSize && normalized.packageSize ? { packageSize: normalized.packageSize } : {}),
              ...(!product.allergensText && normalized.allergensText ? { allergensText: normalized.allergensText } : {}),
              missingFields: normalized.missingFields,
            },
          });
          const hasIdentifier = await tx.productIdentifier.findUnique({ where: { scheme_value: { scheme: "GTIN", value: barcode } } });
          if (!hasIdentifier) await tx.productIdentifier.create({ data: { productId: product.id, scheme: "GTIN", value: barcode } });
        }

        const retrievedAt = new Date();
        const sourceRecord = await tx.productSourceRecord.upsert({
          where: { sourceId_externalId: { sourceId: source.id, externalId: normalized.externalId } },
          create: {
            productId: product.id, sourceId: source.id, externalId: normalized.externalId,
            sourceUrl: normalized.sourceUrl, retrievedAt, sourceUpdatedAt: normalized.sourceUpdatedAt, rawPayload,
          },
          update: { productId: product.id, sourceUrl: normalized.sourceUrl, retrievedAt, sourceUpdatedAt: normalized.sourceUpdatedAt, rawPayload },
        });
        const observations: Array<[string, unknown]> = [
          ["name", normalized.name], ["brand", normalized.brandName], ["category", normalized.categoryName],
          ["imageUrl", normalized.imageUrl], ["packageSize", normalized.packageSize], ["ingredientsText", normalized.ingredientsText], ["allergens", normalized.allergensText],
          ["additivesCodes", normalized.additivesCodes], ["allergenNames", normalized.allergenNames], ["nutritionBasis", normalized.nutritionBasis], ["missingFields", normalized.missingFields],
        ];
        if (normalized.nutrition) {
          for (const [field, value] of Object.entries(normalized.nutrition)) observations.push([`nutrition.${field}`, value]);
          observations.push(["nutrition.basis", normalized.nutritionBasis]);
        }
        const canonicalNutritionFields = new Set<string>();
        for (const [fieldPath, value] of observations) {
          await tx.productFieldObservation.upsert({
            where: { sourceRecordId_fieldPath: { sourceRecordId: sourceRecord.id, fieldPath } },
            create: { productId: product.id, sourceRecordId: sourceRecord.id, fieldPath, value: value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue },
            update: { productId: product.id, value: value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue, observedAt: retrievedAt, isCanonical: false },
          });
        }

        const existingSourceIngredients = await tx.productIngredient.count({ where: { sourceRecordId: sourceRecord.id } });
        const existingAnyIngredients = await tx.productIngredient.count({ where: { productId: product.id } });
        if (normalized.ingredients.length && existingSourceIngredients) {
          await tx.productIngredient.deleteMany({ where: { sourceRecordId: sourceRecord.id } });
        }
        if (normalized.ingredients.length && (existingSourceIngredients > 0 || existingAnyIngredients === 0)) {
          for (const item of normalized.ingredients) {
            const ingredient = await tx.ingredient.upsert({
              where: { normalizedName: item.normalizedName },
              create: { name: item.rawName, normalizedName: item.normalizedName },
              update: {},
            });
            await tx.productIngredient.create({
              data: { productId: product.id, ingredientId: ingredient.id, sourceRecordId: sourceRecord.id, order: item.order, rawName: item.rawName, verification: "UNVERIFIED" },
            });
          }
        }

        await tx.productAllergen.deleteMany({ where: { productId: product.id, sourceRecordId: sourceRecord.id } });
        for (const allergenName of normalized.allergenNames) {
          const allergen = await tx.allergen.upsert({ where: { name: allergenName }, create: { name: allergenName }, update: {} });
          await tx.productAllergen.upsert({
            where: { productId_allergenId: { productId: product.id, allergenId: allergen.id } },
            create: { productId: product.id, allergenId: allergen.id, sourceRecordId: sourceRecord.id, rawText: normalized.allergensText, verification: "UNVERIFIED" },
            update: {},
          });
        }
        if (normalized.nutrition) {
          const data = {
            ...normalized.nutrition,
            productId: product.id,
            sourceRecordId: sourceRecord.id,
            nutritionBasis: normalized.nutritionBasis,
            verification: "UNVERIFIED" as const,
          };
          const nutrientFields = ["energyKcal", "protein", "carbohydrate", "sugar", "addedSugar", "fat", "saturatedFat", "transFat", "fibre", "salt", "sodium", "servingSizeG"] as const;
          const existing = await tx.nutrition.findUnique({ where: { productId: product.id } });
          if (!existing) {
            await tx.nutrition.create({ data });
            for (const field of nutrientFields) if (data[field] !== null) canonicalNutritionFields.add(field);
            if (normalized.nutritionBasis) canonicalNutritionFields.add("basis");
          } else if (existing.sourceRecordId === sourceRecord.id) {
            const update: Prisma.NutritionUpdateInput = {};
            for (const field of nutrientFields) {
              update[field] = data[field];
              if (data[field] !== null) canonicalNutritionFields.add(field);
            }
            update.nutritionBasis = normalized.nutritionBasis;
            if (normalized.nutritionBasis) canonicalNutritionFields.add("basis");
            await tx.nutrition.update({ where: { id: existing.id }, data: update });
          } else if (existing.verification === "UNVERIFIED") {
            const update: Prisma.NutritionUpdateInput = {};
            let changed = false;
            for (const field of nutrientFields) {
              if (existing[field] === null && data[field] !== null) {
                update[field] = data[field];
                canonicalNutritionFields.add(field);
                changed = true;
              }
            }
            if (!existing.nutritionBasis && normalized.nutritionBasis) {
              update.nutritionBasis = normalized.nutritionBasis;
              canonicalNutritionFields.add("basis");
              changed = true;
            }
            if (changed) {
              if (existing.sourceRecordId) update.sourceRecord = { disconnect: true };
              await tx.nutrition.update({ where: { id: existing.id }, data: update });
            }
          }
        }
        for (const field of canonicalNutritionFields) {
          const fieldPath = field === "basis" ? "nutrition.basis" : `nutrition.${field}`;
          await tx.productFieldObservation.update({
            where: { sourceRecordId_fieldPath: { sourceRecordId: sourceRecord.id, fieldPath } },
            data: { isCanonical: true },
          });
        }
        if (!normalized.nutrition) {
          const existingNutrition = await tx.nutrition.findUnique({ where: { productId: product.id } });
          if (existingNutrition?.sourceRecordId === sourceRecord.id) await tx.nutrition.delete({ where: { id: existingNutrition.id } });
        }
        const [ingredientCount, allergenCount, canonicalNutrition] = await Promise.all([
          tx.productIngredient.count({ where: { productId: product.id } }),
          tx.productAllergen.count({ where: { productId: product.id } }),
          tx.nutrition.findUnique({ where: { productId: product.id } }),
        ]);
        const missingFields = [
          ...(!product.brandId ? ["brand"] : []),
          ...(!product.categoryId ? ["category"] : []),
          ...(ingredientCount === 0 ? ["ingredients"] : []),
          ...(!product.allergensText && allergenCount === 0 ? ["allergens"] : []),
          ...(!canonicalNutrition ? ["nutrition"] : [
            ...(["energyKcal", "protein", "carbohydrate", "sugar", "addedSugar", "fat", "saturatedFat", "transFat", "fibre", "salt", "sodium"] as const)
              .filter((field) => canonicalNutrition[field] === null).map((field) => `nutrition.${field}`),
            ...(!canonicalNutrition.nutritionBasis ? ["nutritionBasis"] : []),
          ]),
        ];
        await tx.product.update({ where: { id: product.id }, data: { missingFields } });
        return tx.product.findUniqueOrThrow({ where: { id: product.id }, include: productDetails });
      });
    } catch (error) {
      // Concurrent lookups can race on the global GTIN constraint. Retry once the winner commits.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const winner = await prisma.productIdentifier.findUnique({
          where: { scheme_value: { scheme: "GTIN", value: barcode } },
          include: { product: { include: productDetails } },
        });
        if (winner) return winner.product;
      }
      throw error;
    }
  }
}
