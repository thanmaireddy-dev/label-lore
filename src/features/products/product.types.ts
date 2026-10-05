import { Prisma } from "@prisma/client";

// Core types for the product feature
export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    nutrition: true;
    ingredients: {
      include: {
        ingredient: true;
      };
      orderBy: { order: "asc" };
    };
    claims: {
      include: {
        claim: true;
      };
    };
  };
}>;

export type ProductSummary = Prisma.ProductGetPayload<{
  include: {
    brand: true;
  };
}>;
