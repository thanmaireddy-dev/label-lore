import assert from "node:assert/strict";
import test from "node:test";
import { explanationResultSchema } from "./explanation.contract";

const common = { methodologyVersion: "method-v1", promptVersion: "prompt-v1" };

test("accepts generated, insufficient-data, and unconfigured explanation states", () => {
  assert.equal(explanationResultSchema.safeParse({ ...common, status: "GENERATED", explanation: "Explanation text", aiGenerated: true, model: "model-id", generatedAt: "2026-11-08T10:00:00.000Z" }).success, true);
  assert.equal(explanationResultSchema.safeParse({ ...common, status: "INSUFFICIENT_DATA", explanation: "No grade was generated.", aiGenerated: false, model: null, generatedAt: null }).success, true);
  assert.equal(explanationResultSchema.safeParse({ ...common, status: "NOT_CONFIGURED", explanation: null, aiGenerated: false, model: null, generatedAt: null }).success, true);
});

test("keeps grade and score outside the AI explanation response", () => {
  const parsed = explanationResultSchema.parse({ ...common, status: "GENERATED", explanation: "Explanation text", aiGenerated: true, model: "model-id", generatedAt: "2026-11-08T10:00:00.000Z", grade: "E", score: 0 });
  assert.equal("grade" in parsed, false);
  assert.equal("score" in parsed, false);
});
