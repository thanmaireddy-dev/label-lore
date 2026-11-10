import { ProductService } from "@/features/products/product.service";
import { ScanService } from "@/features/scans/scan.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Flame, ShieldCheck, FileText, Beaker } from "lucide-react";
import { ProductGrade } from "@/components/analysis/product-grade";
import { GradeExplanation } from "@/components/analysis/grade-explanation";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TrackProductView } from "@/components/sections/recent-products";

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

  const n = product.nutrition;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <TrackProductView productId={product.id} name={product.name} brand={product.brand?.name ?? "Unknown brand"} />
      <Link href="/scan" className="mb-8 inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
        <ChevronLeft className="size-4" />
        Back to search or scan another label
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
            <p className="mb-5 text-xs text-foreground-muted">Product data: {product.verificationStatus.toLowerCase().replaceAll("_", " ")}</p>
            {product.sourceRecords.length > 0 && <div className="mb-5 text-xs text-foreground-muted">
              <p className="font-medium">Source information</p>
              {product.sourceRecords.map((record) => <a key={record.id} href={record.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-primary hover:underline">{record.source.name} · retrieved {new Date(record.retrievedAt).toLocaleDateString()}</a>)}
            </div>}
            {product.sourceRecords.length === 0 && <p className="mb-5 text-xs text-foreground-muted">No external source record available.</p>}

            <div className="border-t border-border pt-6"><ProductGrade productId={product.id} /></div>
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
                    {n.nutritionBasis ? `Per ${n.nutritionBasis}` : "Source basis unspecified"}{n.servingSizeG ? ` · Serving ${n.servingSizeG}g` : ""} · {n.verification.toLowerCase().replaceAll("_", " ")}
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
              <p className="mb-4 text-xs text-foreground-muted">Ingredients are shown as source evidence. Additive codes identify substances and do not imply a safety classification or affect the nutrition grade.</p>
              {product.ingredients.length > 0 ? (
                <div className="space-y-3">
                  {product.ingredients.map((pi) => {
                    const ing = pi.ingredient;
                    return (
                      <div
                        key={pi.id}
                        className="rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{ing?.name ?? pi.rawName ?? "Unmatched label ingredient"}</p>
                          {(ing?.function || ing?.category) && (
                            <p className="text-xs text-foreground-muted">
                              {ing?.function || ing?.category}
                              {ing?.additive?.insCode && ` · INS ${ing.additive.insCode}`}
                            </p>
                          )}
                          {ing?.description && (
                            <p className="mt-1 text-xs text-foreground-muted">{ing.description}</p>
                          )}
                        </div>
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

          <GradeExplanation productId={product.id} />

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
