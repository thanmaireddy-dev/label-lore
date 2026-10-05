import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clear existing data (optional, but good for idempotency during dev)
  await prisma.scan.deleteMany();
  await prisma.productClaim.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.nutrition.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();

  // 1. Brands
  const nestle = await prisma.brand.create({ data: { name: "Nestlé India" } });
  const amul = await prisma.brand.create({ data: { name: "Amul" } });
  const britannia = await prisma.brand.create({ data: { name: "Britannia" } });
  const haldiram = await prisma.brand.create({ data: { name: "Haldiram's" } });
  const paperBoat = await prisma.brand.create({ data: { name: "Paper Boat" } });
  const organicTattva = await prisma.brand.create({ data: { name: "Organic Tattva" } });

  // 2. Ingredients
  const wheatFlour = await prisma.ingredient.create({
    data: { name: "Wheat Flour", normalizedName: "wheat flour", category: "Base", function: "Base ingredient" },
  });
  const palmOil = await prisma.ingredient.create({
    data: { name: "Palm Oil", normalizedName: "palm oil", category: "Fat", function: "Frying/Texture" },
  });
  const salt = await prisma.ingredient.create({
    data: { name: "Salt", normalizedName: "salt", category: "Seasoning", function: "Taste/Preservative" },
  });
  const sugar = await prisma.ingredient.create({
    data: { name: "Sugar", normalizedName: "sugar", category: "Sweetener", function: "Taste" },
  });
  const cocoa = await prisma.ingredient.create({
    data: { name: "Cocoa Solids", normalizedName: "cocoa solids", category: "Flavor", function: "Flavor" },
  });
  const msg = await prisma.ingredient.create({
    data: { name: "Monosodium Glutamate", normalizedName: "monosodium glutamate", insCode: "621", category: "Flavor Enhancer", function: "Enhances savoury taste" },
  });
  const tbhq = await prisma.ingredient.create({
    data: { name: "TBHQ", normalizedName: "tbhq", insCode: "319", category: "Antioxidant", function: "Prevents rancidity in fats" },
  });
  const mangoPulp = await prisma.ingredient.create({
    data: { name: "Mango Pulp", normalizedName: "mango pulp", category: "Fruit", function: "Flavor/Base" },
  });
  const brownRice = await prisma.ingredient.create({
    data: { name: "Organic Brown Rice", normalizedName: "brown rice", category: "Base", function: "Base ingredient" },
  });

  // 3. Claims
  const claimNoAddedPreservatives = await prisma.claim.create({ data: { text: "No Added Preservatives", category: "ingredient" } });
  const claimHighProtein = await prisma.claim.create({ data: { text: "High Protein", category: "nutrition" } });
  const claimNatural = await prisma.claim.create({ data: { text: "100% Natural", category: "marketing" } });
  const claimOrganic = await prisma.claim.create({ data: { text: "Certified Organic", category: "process" } });

  // 4. Products & Relationships
  // ----------------------------------------------------
  // Maggi
  const maggi = await prisma.product.create({
    data: {
      name: "Maggi Masala Noodles",
      brandId: nestle.id,
      category: "Instant Noodles",
      nutrition: {
        create: {
          energyKcal: 427, protein: 8, carbohydrate: 63.5, sugar: 1.2, addedSugar: 1.2, fat: 15.7, saturatedFat: 6.8, sodium: 1150, servingSizeG: 70
        }
      },
      ingredients: {
        create: [
          { ingredientId: wheatFlour.id, order: 1 },
          { ingredientId: palmOil.id, order: 2 },
          { ingredientId: salt.id, order: 3 },
          { ingredientId: msg.id, order: 4 },
        ]
      }
    }
  });

  // Amul Dark Chocolate
  const amulDark = await prisma.product.create({
    data: {
      name: "Amul Dark Chocolate",
      brandId: amul.id,
      category: "Confectionery",
      nutrition: {
        create: {
          energyKcal: 555, protein: 7.9, carbohydrate: 53.6, sugar: 44, addedSugar: 44, fat: 34.3, saturatedFat: 21, sodium: 20, servingSizeG: 40
        }
      },
      ingredients: {
        create: [
          { ingredientId: sugar.id, order: 1 },
          { ingredientId: cocoa.id, order: 2 },
        ]
      }
    }
  });

  // Britannia Good Day
  const goodDay = await prisma.product.create({
    data: {
      name: "Britannia Good Day Biscuits",
      brandId: britannia.id,
      category: "Biscuits",
      nutrition: {
        create: {
          energyKcal: 497, protein: 6, carbohydrate: 68, sugar: 22, addedSugar: 21.5, fat: 22.4, saturatedFat: 10.5, sodium: 280, servingSizeG: 30
        }
      },
      ingredients: {
        create: [
          { ingredientId: wheatFlour.id, order: 1 },
          { ingredientId: sugar.id, order: 2 },
          { ingredientId: palmOil.id, order: 3 },
          { ingredientId: tbhq.id, order: 4 },
        ]
      }
    }
  });

  // Haldiram's Aloo Bhujia
  const bhujia = await prisma.product.create({
    data: {
      name: "Haldiram's Aloo Bhujia",
      brandId: haldiram.id,
      category: "Snacks",
      nutrition: {
        create: {
          energyKcal: 580, protein: 10, carbohydrate: 40, sugar: 0, addedSugar: 0, fat: 42, saturatedFat: 14, sodium: 750, servingSizeG: 30
        }
      },
      ingredients: {
        create: [
          { ingredientId: palmOil.id, order: 1 },
          { ingredientId: salt.id, order: 2 },
        ]
      }
    }
  });

  // Paper Boat Aam Panna
  const paperBoatAam = await prisma.product.create({
    data: {
      name: "Paper Boat Aam Panna",
      brandId: paperBoat.id,
      category: "Beverages",
      nutrition: {
        create: {
          energyKcal: 52, protein: 0, carbohydrate: 13, sugar: 12, addedSugar: 12, fat: 0, saturatedFat: 0, sodium: 80, servingSizeG: 200
        }
      },
      ingredients: {
        create: [
          { ingredientId: mangoPulp.id, order: 1 },
          { ingredientId: sugar.id, order: 2 },
        ]
      },
      claims: {
        create: [
          { claimId: claimNoAddedPreservatives.id },
          { claimId: claimNatural.id },
        ]
      }
    }
  });

  // Organic Tattva Brown Rice
  const brownRiceProduct = await prisma.product.create({
    data: {
      name: "Organic Tattva Brown Rice",
      brandId: organicTattva.id,
      category: "Grains",
      nutrition: {
        create: {
          energyKcal: 362, protein: 7.5, carbohydrate: 76, sugar: 0, addedSugar: 0, fat: 2.7, saturatedFat: 0.5, fibre: 3.5, sodium: 0, servingSizeG: 50
        }
      },
      ingredients: {
        create: [
          { ingredientId: brownRice.id, order: 1 }
        ]
      },
      claims: {
        create: [
          { claimId: claimOrganic.id },
          { claimId: claimHighProtein.id }
        ]
      }
    }
  });

  // 5. Scans (Demonstration scans to populate the Recent Scans carousel)
  await prisma.scan.create({ data: { productId: maggi.id, source: "manual" } });
  await prisma.scan.create({ data: { productId: amulDark.id, source: "manual" } });
  await prisma.scan.create({ data: { productId: goodDay.id, source: "manual" } });
  await prisma.scan.create({ data: { productId: bhujia.id, source: "manual" } });
  await prisma.scan.create({ data: { productId: paperBoatAam.id, source: "manual" } });
  await prisma.scan.create({ data: { productId: brownRiceProduct.id, source: "manual" } });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
