import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourcePath = resolve(root, "prisma/dev.db");
const backupPath = resolve(root, "prisma/backups/dev-pre-postgresql-20261031.db");
const prisma = new PrismaClient();
const sqlite = new DatabaseSync(sourcePath, { readOnly: true });

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function date(value) {
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) throw new Error(`Invalid legacy timestamp: ${value}`);
  return result;
}

function rows(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

async function transfer() {
  const sourceHash = sha256(sourcePath);
  if (sourceHash !== sha256(backupPath)) {
    throw new Error("SQLite backup hash does not match prisma/dev.db; transfer stopped.");
  }

  const fkErrors = sqlite.prepare("PRAGMA foreign_key_check").all();
  if (fkErrors.length) throw new Error(`SQLite foreign_key_check found ${fkErrors.length} invalid relationships.`);

  const source = {
    brands: rows("Brand"),
    products: rows("Product"),
    ingredients: rows("Ingredient"),
    productIngredients: rows("ProductIngredient"),
    nutrition: rows("Nutrition"),
    claims: rows("Claim"),
    productClaims: rows("ProductClaim"),
    scans: rows("Scan"),
  };
  const categories = [...new Set(source.products.map((row) => row.category?.trim()).filter(Boolean))];
  const additives = new Map();
  for (const ingredient of source.ingredients) {
    if (ingredient.insCode && !additives.has(ingredient.insCode)) additives.set(ingredient.insCode, ingredient);
  }

  await prisma.$transaction(async (tx) => {
    for (const row of source.brands) {
      await tx.brand.upsert({
        where: { id: row.id },
        create: { id: row.id, name: row.name, createdAt: date(row.createdAt), updatedAt: date(row.updatedAt) },
        update: {},
      });
    }

    const categoryIds = new Map();
    for (const name of categories) {
      const category = await tx.category.upsert({ where: { name }, create: { name }, update: {} });
      categoryIds.set(name, category.id);
    }

    const additiveIds = new Map();
    for (const [insCode, ingredient] of additives) {
      const additive = await tx.additive.upsert({
        where: { insCode },
        create: { insCode, commonName: ingredient.name, function: ingredient.function },
        update: {},
      });
      additiveIds.set(insCode, additive.id);
    }

    for (const row of source.ingredients) {
      await tx.ingredient.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          normalizedName: row.normalizedName,
          category: row.category,
          function: row.function,
          description: row.description,
          additiveId: row.insCode ? additiveIds.get(row.insCode) ?? null : null,
          createdAt: date(row.createdAt),
          updatedAt: date(row.updatedAt),
        },
        update: {},
      });
    }

    for (const row of source.products) {
      const categoryName = row.category?.trim() || null;
      await tx.product.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          brandId: row.brandId,
          categoryId: categoryName ? categoryIds.get(categoryName) ?? null : null,
          imageUrl: row.imageUrl,
          createdAt: date(row.createdAt),
          updatedAt: date(row.updatedAt),
          verificationStatus: "UNVERIFIED",
          missingFields: [],
        },
        update: {},
      });
    }

    for (const row of source.productIngredients) {
      await tx.productIngredient.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          productId: row.productId,
          ingredientId: row.ingredientId,
          order: row.order,
          rawName: row.rawName,
          verification: "UNVERIFIED",
        },
        update: {},
      });
    }

    for (const row of source.nutrition) {
      await tx.nutrition.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          productId: row.productId,
          energyKcal: row.energyKcal,
          protein: row.protein,
          carbohydrate: row.carbohydrate,
          sugar: row.sugar,
          addedSugar: row.addedSugar,
          fat: row.fat,
          saturatedFat: row.saturatedFat,
          transFat: row.transFat,
          fibre: row.fibre,
          sodium: row.sodium,
          servingSizeG: row.servingSizeG,
          nutritionBasis: null,
          verification: "UNVERIFIED",
        },
        update: {},
      });
    }

    for (const row of source.claims) {
      await tx.claim.upsert({
        where: { id: row.id },
        create: { id: row.id, text: row.text, category: row.category },
        update: {},
      });
    }

    for (const row of source.productClaims) {
      await tx.productClaim.upsert({
        where: { id: row.id },
        create: { id: row.id, productId: row.productId, claimId: row.claimId },
        update: {},
      });
    }

    for (const row of source.scans) {
      await tx.scan.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          productId: row.productId,
          source: row.source,
          createdAt: date(row.createdAt),
        },
        update: {},
      });
    }

    const expected = {
      brands: source.brands.length,
      categories: categories.length,
      products: source.products.length,
      ingredients: source.ingredients.length,
      additives: additives.size,
      productIngredients: source.productIngredients.length,
      nutrition: source.nutrition.length,
      claims: source.claims.length,
      productClaims: source.productClaims.length,
      scans: source.scans.length,
    };
    const actual = {
      brands: await tx.brand.count(),
      categories: await tx.category.count(),
      products: await tx.product.count(),
      ingredients: await tx.ingredient.count(),
      additives: await tx.additive.count(),
      productIngredients: await tx.productIngredient.count(),
      nutrition: await tx.nutrition.count(),
      claims: await tx.claim.count(),
      productClaims: await tx.productClaim.count(),
      scans: await tx.scan.count(),
    };
    for (const [table, count] of Object.entries(expected)) {
      if (actual[table] < count) throw new Error(`${table}: expected at least ${count} rows after transfer, found ${actual[table]}.`);
    }

    const idChecks = [
      [tx.brand, source.brands, "Brand"],
      [tx.product, source.products, "Product"],
      [tx.ingredient, source.ingredients, "Ingredient"],
      [tx.productIngredient, source.productIngredients, "ProductIngredient"],
      [tx.nutrition, source.nutrition, "Nutrition"],
      [tx.claim, source.claims, "Claim"],
      [tx.productClaim, source.productClaims, "ProductClaim"],
      [tx.scan, source.scans, "Scan"],
    ];
    for (const [delegate, records, table] of idChecks) {
      const ids = records.map((row) => row.id);
      const found = await delegate.findMany({ where: { id: { in: ids } }, select: { id: true } });
      if (found.length !== ids.length) throw new Error(`${table}: not all legacy IDs were found after transfer.`);
    }
    const foundCategories = await tx.category.findMany({ where: { name: { in: categories } }, select: { name: true } });
    if (foundCategories.length !== categories.length) throw new Error("Not all legacy product categories were mapped.");
    const insCodes = [...additives.keys()];
    const foundAdditives = await tx.additive.findMany({ where: { insCode: { in: insCodes } }, select: { insCode: true } });
    if (foundAdditives.length !== insCodes.length) throw new Error("Not all legacy additive codes were mapped.");

    const relationships = await tx.$queryRaw`
      SELECT 'Product.brandId' AS relationship, count(*)::int AS orphan_count
      FROM food."Product" p LEFT JOIN food."Brand" b ON b.id = p."brandId"
      WHERE p."brandId" IS NOT NULL AND b.id IS NULL
      UNION ALL
      SELECT 'Product.categoryId', count(*)::int
      FROM food."Product" p LEFT JOIN food."Category" c ON c.id = p."categoryId"
      WHERE p."categoryId" IS NOT NULL AND c.id IS NULL
      UNION ALL
      SELECT 'ProductIngredient.productId', count(*)::int
      FROM food."ProductIngredient" pi LEFT JOIN food."Product" p ON p.id = pi."productId"
      WHERE p.id IS NULL
      UNION ALL
      SELECT 'ProductIngredient.ingredientId', count(*)::int
      FROM food."ProductIngredient" pi LEFT JOIN food."Ingredient" i ON i.id = pi."ingredientId"
      WHERE pi."ingredientId" IS NOT NULL AND i.id IS NULL
      UNION ALL
      SELECT 'Ingredient.additiveId', count(*)::int
      FROM food."Ingredient" i LEFT JOIN food."Additive" a ON a.id = i."additiveId"
      WHERE i."additiveId" IS NOT NULL AND a.id IS NULL
      UNION ALL
      SELECT 'Nutrition.productId', count(*)::int
      FROM food."Nutrition" n LEFT JOIN food."Product" p ON p.id = n."productId"
      WHERE p.id IS NULL
      UNION ALL
      SELECT 'ProductClaim.productId', count(*)::int
      FROM food."ProductClaim" pc LEFT JOIN food."Product" p ON p.id = pc."productId"
      WHERE p.id IS NULL
      UNION ALL
      SELECT 'ProductClaim.claimId', count(*)::int
      FROM food."ProductClaim" pc LEFT JOIN food."Claim" c ON c.id = pc."claimId"
      WHERE c.id IS NULL
      UNION ALL
      SELECT 'Scan.productId', count(*)::int
      FROM app."Scan" s LEFT JOIN food."Product" p ON p.id = s."productId"
      WHERE s."productId" IS NOT NULL AND p.id IS NULL
    `;
    const broken = relationships.filter((row) => row.orphan_count !== 0);
    if (broken.length) throw new Error(`Relationship verification failed: ${JSON.stringify(broken)}`);

    console.log(JSON.stringify({ sourceCounts: expected, targetCounts: actual, brokenRelationships: 0 }, null, 2));
  }, { maxWait: 10_000, timeout: 60_000 });

  console.log(`SQLite source and backup SHA-256 match: ${sourceHash}`);
  console.log(`SQLite source retained: ${sourcePath}`);
}

try {
  await transfer();
} finally {
  sqlite.close();
  await prisma.$disconnect();
}
