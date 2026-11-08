CREATE TABLE "food"."ProductGradeExplanation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductGradeExplanation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductGradeExplanation_productId_methodologyVersion_promptVersion_key"
    ON "food"."ProductGradeExplanation"("productId", "methodologyVersion", "promptVersion");

CREATE INDEX "ProductGradeExplanation_productId_idx"
    ON "food"."ProductGradeExplanation"("productId");

ALTER TABLE "food"."ProductGradeExplanation"
    ADD CONSTRAINT "ProductGradeExplanation_productId_methodologyVersion_fkey"
    FOREIGN KEY ("productId", "methodologyVersion")
    REFERENCES "food"."ProductGradingResult"("productId", "methodologyVersion")
    ON DELETE CASCADE ON UPDATE CASCADE;
