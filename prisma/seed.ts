import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sampleBrands = ["Nestlé India", "Amul", "Britannia", "Haldiram's", "Paper Boat", "Organic Tattva"];
  const brands = Object.fromEntries(await Promise.all(sampleBrands.map(async (name) => [name, await prisma.brand.upsert({ where: { name }, create: { name }, update: {} })])));
  const ingredientRows = [
    ["Wheat Flour", "wheat flour", "Base", "Base ingredient"],
    ["Palm Oil", "palm oil", "Fat", "Frying/Texture"],
    ["Salt", "salt", "Seasoning", "Taste"],
    ["Sugar", "sugar", "Sweetener", "Taste"],
    ["Cocoa Solids", "cocoa solids", "Flavor", "Flavor"],
    ["Monosodium Glutamate", "monosodium glutamate", "Flavor Enhancer", "Enhances savoury taste"],
    ["TBHQ", "tbhq", "Antioxidant", "Prevents rancidity in fats"],
    ["Mango Pulp", "mango pulp", "Fruit", "Flavor/Base"],
    ["Organic Brown Rice", "brown rice", "Base", "Base ingredient"],
  ];
  const ingredients: Record<string, { id: string }> = {};
  for (const [name, normalizedName, category, fn] of ingredientRows) {
    ingredients[normalizedName] = await prisma.ingredient.upsert({
      where: { normalizedName }, create: { name, normalizedName, category, function: fn }, update: {},
    });
  }
  for (const [insCode, commonName, normalizedName] of [["621", "Monosodium Glutamate", "monosodium glutamate"], ["319", "TBHQ", "tbhq"]] as const) {
    const additive = await prisma.additive.upsert({ where: { insCode }, create: { insCode, commonName }, update: {} });
    await prisma.ingredient.update({ where: { normalizedName }, data: { additiveId: additive.id } });
  }

  const claims = Object.fromEntries(await Promise.all([
    ["No Added Preservatives", "ingredient"], ["High Protein", "nutrition"], ["100% Natural", "marketing"], ["Certified Organic", "process"],
  ].map(async ([text, category]) => [text, await prisma.claim.upsert({ where: { text }, create: { text, category }, update: {} })])));

  type SeedRow = { name: string; brand: string; category: string; nutrition: Record<string, number>; ingredients: string[]; claims?: string[] };
  const rows: SeedRow[] = [
    { name: "Maggi Masala Noodles", brand: "Nestlé India", category: "Instant Noodles", nutrition: { energyKcal: 427, protein: 8, carbohydrate: 63.5, sugar: 1.2, addedSugar: 1.2, fat: 15.7, saturatedFat: 6.8, sodium: 1150, servingSizeG: 70 }, ingredients: ["wheat flour", "palm oil", "salt", "monosodium glutamate"] },
    { name: "Amul Dark Chocolate", brand: "Amul", category: "Confectionery", nutrition: { energyKcal: 555, protein: 7.9, carbohydrate: 53.6, sugar: 44, addedSugar: 44, fat: 34.3, saturatedFat: 21, sodium: 20, servingSizeG: 40 }, ingredients: ["sugar", "cocoa solids"] },
    { name: "Britannia Good Day Biscuits", brand: "Britannia", category: "Biscuits", nutrition: { energyKcal: 497, protein: 6, carbohydrate: 68, sugar: 22, addedSugar: 21.5, fat: 22.4, saturatedFat: 10.5, sodium: 280, servingSizeG: 30 }, ingredients: ["wheat flour", "sugar", "palm oil", "tbhq"] },
    { name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", category: "Snacks", nutrition: { energyKcal: 580, protein: 10, carbohydrate: 40, sugar: 0, addedSugar: 0, fat: 42, saturatedFat: 14, sodium: 750, servingSizeG: 30 }, ingredients: ["palm oil", "salt"] },
    { name: "Paper Boat Aam Panna", brand: "Paper Boat", category: "Beverages", nutrition: { energyKcal: 52, protein: 0, carbohydrate: 13, sugar: 12, addedSugar: 12, fat: 0, saturatedFat: 0, sodium: 80, servingSizeG: 200 }, ingredients: ["mango pulp", "sugar"], claims: ["No Added Preservatives", "100% Natural"] },
    { name: "Organic Tattva Brown Rice", brand: "Organic Tattva", category: "Grains", nutrition: { energyKcal: 362, protein: 7.5, carbohydrate: 76, sugar: 0, addedSugar: 0, fat: 2.7, saturatedFat: 0.5, fibre: 3.5, sodium: 0, servingSizeG: 50 }, ingredients: ["brown rice"], claims: ["Certified Organic", "High Protein"] },
  ];

  for (const row of rows) {
    const existing = await prisma.product.findFirst({ where: { name: row.name, brandId: brands[row.brand].id } });
    if (existing) continue;
    const category = await prisma.category.upsert({ where: { name: row.category }, create: { name: row.category }, update: {} });
    await prisma.product.create({
      data: {
        name: row.name, brandId: brands[row.brand].id, categoryId: category.id,
        verificationStatus: "UNVERIFIED", missingFields: [],
        nutrition: { create: { ...row.nutrition, nutritionBasis: "100g", verification: "UNVERIFIED" } },
        ingredients: { create: row.ingredients.map((normalizedName, order) => ({
          ingredientId: ingredients[normalizedName].id, rawName: ingredientRows.find((r) => r[1] === normalizedName)?.[0],
          order, verification: "UNVERIFIED",
        })) },
        ...(row.claims ? { claims: { create: row.claims.map((text) => ({ claimId: claims[text].id })) } } : {}),
      },
    });
  }
  console.log("Seed data is present; existing records were left intact.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
