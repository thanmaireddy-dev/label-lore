CREATE TABLE "food"."ProductGradingResult" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "grade" TEXT,
    "score" INTEGER,
    "status" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "dataCompleteness" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductGradingResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductGradingResult_productId_methodologyVersion_key"
    ON "food"."ProductGradingResult"("productId", "methodologyVersion");
CREATE INDEX "ProductGradingResult_calculatedAt_idx"
    ON "food"."ProductGradingResult"("calculatedAt");

ALTER TABLE "food"."ProductGradingResult"
    ADD CONSTRAINT "ProductGradingResult_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "food"."Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
