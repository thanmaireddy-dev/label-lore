CREATE TABLE "food"."FoodLabelAnalysis" (
    "id" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "submissionFingerprint" TEXT NOT NULL,
    "sourceRawText" TEXT NOT NULL,
    "ocrDraft" JSONB NOT NULL,
    "confirmedData" JSONB NOT NULL,
    "nutritionBasis" TEXT,
    "verificationStatus" "food"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "status" TEXT NOT NULL,
    "grade" TEXT,
    "score" INTEGER,
    "methodologyVersion" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "dataCompleteness" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "explanation" TEXT,
    "explanationModel" TEXT,
    "explanationMethodologyVersion" TEXT,
    "explanationPromptVersion" TEXT,
    "explanationCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLabelAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoodLabelAnalysis_submissionKey_key"
    ON "food"."FoodLabelAnalysis"("submissionKey");

CREATE INDEX "FoodLabelAnalysis_createdAt_idx"
    ON "food"."FoodLabelAnalysis"("createdAt");
