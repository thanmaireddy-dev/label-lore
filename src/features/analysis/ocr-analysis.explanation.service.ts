import { ProductGradeExplanationService } from "./explanation.service";
import { PrismaOcrAnalysisExplanationRepository } from "./ocr-analysis.explanation.repository";

export const ocrGradeExplanationService = new ProductGradeExplanationService(new PrismaOcrAnalysisExplanationRepository());
