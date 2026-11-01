import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductRepository } from "@/features/products/product.repository";
import { scoreProduct } from "./grading";

export class ProductGradingService {
  static async calculateAndPersist(productId: string) {
    const product = await ProductRepository.getById(productId);
    if (!product) return null;

    const result = scoreProduct({
      productId: product.id,
      nutrition: product.nutrition ? {
        energyKcal: product.nutrition.energyKcal,
        saturatedFat: product.nutrition.saturatedFat,
        sugar: product.nutrition.sugar,
        sodium: product.nutrition.sodium,
        salt: product.nutrition.salt,
        fibre: product.nutrition.fibre,
        protein: product.nutrition.protein,
        transFat: product.nutrition.transFat,
        nutritionBasis: product.nutrition.nutritionBasis,
        verification: product.nutrition.verification,
      } : null,
      ingredients: product.ingredients.map(({ rawName, ingredient }) => ({
        rawName,
        normalizedName: ingredient?.normalizedName ?? null,
        additive: ingredient?.additive ? {
          insCode: ingredient.additive.insCode,
          commonName: ingredient.additive.commonName,
        } : null,
      })),
    });

    return prisma.productGradingResult.upsert({
      where: { productId_methodologyVersion: { productId: product.id, methodologyVersion: result.methodologyVersion } },
      create: {
        productId: product.id,
        grade: result.grade,
        score: result.score,
        status: result.status,
        methodologyVersion: result.methodologyVersion,
        factors: result.factors as Prisma.InputJsonValue,
        dataCompleteness: result.dataCompleteness as Prisma.InputJsonValue,
      },
      update: {
        grade: result.grade,
        score: result.score,
        status: result.status,
        factors: result.factors as Prisma.InputJsonValue,
        dataCompleteness: result.dataCompleteness as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
    });
  }
}
