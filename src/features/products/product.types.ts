import { Prisma } from "@prisma/client";

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    category: true;
    nutrition: true;
    ingredients: { include: { ingredient: { include: { additive: true } } }; orderBy: { order: "asc" } };
    claims: { include: { claim: true } };
  };
}>;

export type ProductSummary = Prisma.ProductGetPayload<{ include: { brand: true; category: true } }>;
