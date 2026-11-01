import { HeroSection } from "@/components/hero/hero-section";
import { FeaturedScan } from "@/components/sections/featured-scan";
import { HowItWorks } from "@/components/sections/how-it-works";
import { RecentScans, RecentScanItem } from "@/components/sections/recent-scans";
import { CTABanner } from "@/components/sections/cta-banner";
import { Newsletter } from "@/components/sections/newsletter";
import { ScanService } from "@/features/scans/scan.service";
import { ProductService } from "@/features/products/product.service";

export const dynamic = "force-dynamic";

/**
 * Landing Page — Phase 1 & 2
 *
 * Assembles the single-column narrative layout per design spec §15.
 * Now fetches real data for Recent Scans via ScanService and FeaturedScan via ProductService.
 */
export default async function HomePage() {
  // 1. Fetch recent scans
  const recentScansFromDb = await ScanService.getRecentScans(10);
  
  // 2. Fetch featured product (just picking the first one we find for Phase 2)
  const allProducts = await ProductService.getAllProducts(1);
  const featuredProductId = allProducts[0]?.id;
  const featuredProduct = featuredProductId 
    ? await ProductService.getProductById(featuredProductId) 
    : null;

  // Pass persisted product IDs; the grade cards load the current persisted
  // methodology result from the grading API.
  const mappedScans: RecentScanItem[] = recentScansFromDb.map((scan) => {
    return {
      id: scan.id,
      productId: scan.product?.id ?? null,
      name: scan.product?.name || "Unknown Product",
      brand: scan.product?.brand?.name || "Unknown Brand",
      scannedAgo: "Recently",
    };
  });

  return (
    <>
      <HeroSection />
      {featuredProduct && <FeaturedScan product={featuredProduct} />}
      <HowItWorks />
      {mappedScans.length > 0 ? (
        <RecentScans scans={mappedScans} />
      ) : null}
      <CTABanner />
      <Newsletter />
    </>
  );
}
