import { z } from "zod";

const explanationBase = z.object({
  status: z.enum(["GENERATED", "INSUFFICIENT_DATA", "NOT_CONFIGURED", "NOT_GENERATED"]),
  explanation: z.string().nullable(),
  aiGenerated: z.boolean(),
  methodologyVersion: z.string(),
  promptVersion: z.string(),
  model: z.string().nullable(),
  generatedAt: z.string().datetime().nullable(),
});

export const explanationResultSchema = explanationBase.refine((result) => {
  if (result.status === "GENERATED") return result.aiGenerated && !!result.explanation && !!result.model && !!result.generatedAt;
  if (result.status === "INSUFFICIENT_DATA") return !result.aiGenerated && !!result.explanation && result.model === null && result.generatedAt === null;
  return !result.aiGenerated && result.explanation === null && result.model === null && result.generatedAt === null;
}, { message: "Explanation fields must match the response status." });

export const explanationResponseSchema = z.object({ data: explanationResultSchema });
export type ExplanationResult = z.infer<typeof explanationResultSchema>;
