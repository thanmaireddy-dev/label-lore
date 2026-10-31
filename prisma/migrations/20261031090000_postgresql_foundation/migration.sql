-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "food";

-- CreateEnum
CREATE TYPE "food"."VerificationStatus" AS ENUM ('UNVERIFIED', 'LABEL_CONFIRMED', 'REGULATORY_VERIFIED');

-- CreateTable
CREATE TABLE "food"."Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "imageUrl" TEXT,
    "packageSize" TEXT,
    "allergensText" TEXT,
    "verificationStatus" "food"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "missingFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."ProductIdentifier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "function" TEXT,
    "description" TEXT,
    "additiveId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Additive" (
    "id" TEXT NOT NULL,
    "insCode" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "function" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Additive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."ProductIngredient" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "sourceRecordId" TEXT,
    "order" INTEGER NOT NULL,
    "rawName" TEXT,
    "verification" "food"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Nutrition" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "energyKcal" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbohydrate" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "addedSugar" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "saturatedFat" DOUBLE PRECISION,
    "transFat" DOUBLE PRECISION,
    "fibre" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "servingSizeG" DOUBLE PRECISION,
    "nutritionBasis" TEXT DEFAULT '100g',
    "verification" "food"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Claim" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."ProductClaim" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,

    CONSTRAINT "ProductClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."Allergen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."ProductAllergen" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "allergenId" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "rawText" TEXT,
    "verification" "food"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "ProductAllergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."FoodSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "license" TEXT,
    "attribution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."ProductSourceRecord" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUpdatedAt" TIMESTAMP(3),
    "rawPayload" JSONB NOT NULL,

    CONSTRAINT "ProductSourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."ProductFieldObservation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductFieldObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Scan" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."SearchEvent" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "productId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "food"."Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "food"."Category"("name");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "food"."Product"("name");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "food"."Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "food"."Product"("categoryId");

-- CreateIndex
CREATE INDEX "ProductIdentifier_productId_idx" ON "food"."ProductIdentifier"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIdentifier_scheme_value_key" ON "food"."ProductIdentifier"("scheme", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_normalizedName_key" ON "food"."Ingredient"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_additiveId_key" ON "food"."Ingredient"("additiveId");

-- CreateIndex
CREATE UNIQUE INDEX "Additive_insCode_key" ON "food"."Additive"("insCode");

-- CreateIndex
CREATE INDEX "ProductIngredient_productId_idx" ON "food"."ProductIngredient"("productId");

-- CreateIndex
CREATE INDEX "ProductIngredient_ingredientId_idx" ON "food"."ProductIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIngredient_productId_sourceRecordId_order_key" ON "food"."ProductIngredient"("productId", "sourceRecordId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrition_productId_key" ON "food"."Nutrition"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_text_key" ON "food"."Claim"("text");

-- CreateIndex
CREATE UNIQUE INDEX "ProductClaim_productId_claimId_key" ON "food"."ProductClaim"("productId", "claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_key" ON "food"."Allergen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAllergen_productId_allergenId_key" ON "food"."ProductAllergen"("productId", "allergenId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodSource_key_key" ON "food"."FoodSource"("key");

-- CreateIndex
CREATE INDEX "ProductSourceRecord_productId_idx" ON "food"."ProductSourceRecord"("productId");

-- CreateIndex
CREATE INDEX "ProductSourceRecord_retrievedAt_idx" ON "food"."ProductSourceRecord"("retrievedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSourceRecord_sourceId_externalId_key" ON "food"."ProductSourceRecord"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "ProductFieldObservation_productId_fieldPath_idx" ON "food"."ProductFieldObservation"("productId", "fieldPath");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFieldObservation_sourceRecordId_fieldPath_key" ON "food"."ProductFieldObservation"("sourceRecordId", "fieldPath");

-- CreateIndex
CREATE INDEX "Scan_userId_createdAt_idx" ON "app"."Scan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_sessionId_createdAt_idx" ON "app"."Scan"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_productId_createdAt_idx" ON "app"."Scan"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchEvent_userId_createdAt_idx" ON "app"."SearchEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchEvent_sessionId_createdAt_idx" ON "app"."SearchEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchEvent_productId_createdAt_idx" ON "app"."SearchEvent"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "food"."Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "food"."Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "food"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductIdentifier" ADD CONSTRAINT "ProductIdentifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."Ingredient" ADD CONSTRAINT "Ingredient_additiveId_fkey" FOREIGN KEY ("additiveId") REFERENCES "food"."Additive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductIngredient" ADD CONSTRAINT "ProductIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductIngredient" ADD CONSTRAINT "ProductIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "food"."Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductIngredient" ADD CONSTRAINT "ProductIngredient_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "food"."ProductSourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."Nutrition" ADD CONSTRAINT "Nutrition_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."Nutrition" ADD CONSTRAINT "Nutrition_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "food"."ProductSourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductClaim" ADD CONSTRAINT "ProductClaim_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductClaim" ADD CONSTRAINT "ProductClaim_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "food"."Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductAllergen" ADD CONSTRAINT "ProductAllergen_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductAllergen" ADD CONSTRAINT "ProductAllergen_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "food"."Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductAllergen" ADD CONSTRAINT "ProductAllergen_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "food"."ProductSourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductSourceRecord" ADD CONSTRAINT "ProductSourceRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductSourceRecord" ADD CONSTRAINT "ProductSourceRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "food"."FoodSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductFieldObservation" ADD CONSTRAINT "ProductFieldObservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."ProductFieldObservation" ADD CONSTRAINT "ProductFieldObservation_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "food"."ProductSourceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Scan" ADD CONSTRAINT "Scan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."SearchEvent" ADD CONSTRAINT "SearchEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."SearchEvent" ADD CONSTRAINT "SearchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
