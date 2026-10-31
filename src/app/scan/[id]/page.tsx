import { ProductService } from "@/features/products/product.service";
import { ScanService } from "@/features/scans/scan.service";
import { StatusPill } from "@/components/ui/status-pill";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Flame, AlertTriangle, ShieldCheck, FileText, Beaker } from "lucide-react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await ProductService.getProductById(id);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} - ${product.brand?.name ?? "Unknown brand"} | Label Reader`,
    description: `Analysis of ${product.name} by ${product.brand?.name ?? "Unknown brand"}`,
  };
}

export default async function ScanResultPage({ params }: PageProps) {
  const { id } = await params;

  // Try to load as a product directly first, then fall back to loading via scan
  let product = await ProductService.getProductById(id);

  if (!product) {
    // id might be a scan id — look up the scan's product
    const scan = await ScanService.getScanById(id);
    if (scan?.product) {
      product = await ProductService.getProductById(scan.product.id);
    }
  }

  if (!product) {
    notFound();
  }

  // Record a scan visit (fire-and-forget; failures don't block the page)
  ScanService.createScan(product.id, "manual").catch(() => {});

  // Phase 2 mock scoring (Phase 3 will have deterministic scoring engine)
  const mockScore = (product.name.length * 7) % 100;
  let grade = "C";
  let statusClass = "text-caution bg-caution-bg";
  if (mockScore >= 80) { grade = "A"; statusClass = "text-safe bg-safe-bg"; }
  else if (mockScore >= 60) { grade = "B"; statusClass = "text-safe bg-safe-bg"; }
  else if (mockScore >= 40) { grade = "C"; statusClass = "text-caution bg-caution-bg"; }
  else { grade = "D"; statusClass = "text-flag bg-flag-bg"; }

  const n = product.nutrition;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
        <ChevronLeft className="size-4" />
        Back to home
      </Link>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Product Info & Score */}
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] border border-border">
            <div className="mb-6 flex items-center justify-center rounded-xl bg-primary/5 py-8">
              <Flame className="size-16 text-primary/40" strokeWidth={1} />
            </div>

            <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
            <p className="mb-1 text-foreground-muted">{product.brand?.name ?? "Unknown brand"}</p>
            {product.category?.name && (
              <p className="mb-6 text-xs text-foreground-muted">{product.category.name}</p>
            )}

            <div className="border-t border-border pt-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                    Label Score
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-semibold ${statusClass.split(" ")[0]}`}
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {mockScore}
                    </span>
                    <span className="text-sm text-foreground-muted">/ 100</span>
                  </div>
                </div>
                <span
                  className={`inline-flex size-14 items-center justify-center rounded-xl text-2xl font-bold ${statusClass}`}
                >
                  {grade}
                </span>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-flag via-caution to-safe"
                    style={{ width: `${mockScore}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-foreground-muted">
                Deterministic scoring arrives in Phase 3.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-8 md:col-span-2">

          {/* Claims */}
          {product.claims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Product Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.claims.map((pc) => (
                    <StatusPill key={pc.claimId} variant="primary">
                      {pc.claim.text}
                    </StatusPill>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nutrition */}
          {n && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  Nutrition Facts
                  <span className="ml-auto text-xs font-normal text-foreground-muted">
                    {n.nutritionBasis ? `Per ${n.nutritionBasis}` : "Source basis unspecified"}{n.servingSizeG ? ` · Serving ${n.servingSizeG}g` : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <NutritionItem label="Energy" value={`${n.energyKcal ?? "--"} kcal`} />
                  <NutritionItem label="Protein" value={`${n.protein ?? "--"}g`} />
                  <NutritionItem label="Carbs" value={`${n.carbohydrate ?? "--"}g`} />
                  <NutritionItem label="Total Sugar" value={`${n.sugar != null ? `${n.sugar}g` : "--"}`} />
                  <NutritionItem label="Added Sugar" value={n.addedSugar != null ? `${n.addedSugar}g` : "--"} />
                  <NutritionItem label="Total Fat" value={`${n.fat != null ? `${n.fat}g` : "--"}`} />
                  <NutritionItem label="Sat. Fat" value={n.saturatedFat != null ? `${n.saturatedFat}g` : "--"} />
                  <NutritionItem label="Sodium" value={n.sodium != null ? `${n.sodium}mg` : "--"} />
                  {n.fibre != null && (
                    <NutritionItem label="Fibre" value={`${n.fibre}g`} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="size-5 text-primary" />
                Ingredients Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.ingredients.length > 0 ? (
                <div className="space-y-3">
                  {product.ingredients.map((pi) => {
                    const ing = pi.ingredient;
                    // Mock warning logic for Phase 2 — Phase 3 will replace with rules engine
                    let variant: "safe" | "caution" | "flag" = "safe";
                    if (ing?.category === "Sweetener") variant = "caution";
                    if ((ing?.name ?? pi.rawName ?? "").toLowerCase().includes("palm")) variant = "caution";
                    if (ing?.additive?.insCode) variant = "flag";
                    if ((ing?.name ?? pi.rawName ?? "").includes("TBHQ")) variant = "flag";

                    return (
                      <div
                        key={pi.id}
                        className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{ing?.name ?? pi.rawName ?? "Unmatched label ingredient"}</p>
                          {(ing?.function || ing?.category) && (
                            <p className="text-xs text-foreground-muted">
                              {ing?.function || ing?.category}
                              {ing?.additive?.insCode && ` (INS ${ing.additive.insCode})`}
                            </p>
                          )}
                          {ing?.description && (
                            <p className="mt-1 text-xs text-foreground-muted">{ing.description}</p>
                          )}
                        </div>
                        <StatusPill variant={variant}>
                          {variant === "flag"
                            ? "Check"
                            : variant === "caution"
                            ? "Caution"
                            : "Safe"}
                        </StatusPill>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-foreground-muted">
                  No ingredient data available for this product.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Phase 3 placeholder */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 size-8 text-foreground-muted/40" strokeWidth={1} />
            <p className="text-sm font-medium text-foreground-muted">
              Full analysis coming in Phase 3
            </p>
            <p className="mt-1 text-xs text-foreground-muted/60">
              Deterministic ingredient scoring, nutrition benchmarks, and claim verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NutritionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-3 border border-border/50">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
