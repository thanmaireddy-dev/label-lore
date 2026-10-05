import { HeroSection } from "@/components/hero/hero-section";
import { FeaturedScan } from "@/components/sections/featured-scan";
import { HowItWorks } from "@/components/sections/how-it-works";
import { RecentScans, RecentScanItem } from "@/components/sections/recent-scans";
import { CTABanner } from "@/components/sections/cta-banner";
import { Newsletter } from "@/components/sections/newsletter";
import { ScanService } from "@/features/scans/scan.service";
import { ProductService } from "@/features/products/product.service";

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

  // Map DB structure to UI format. For Phase 2 we mock the scoring since
  // the deterministic scoring engine belongs to Phase 3.
  const mappedScans: RecentScanItem[] = recentScansFromDb.map((scan) => {
    // Generate a deterministically mock score for Phase 2 based on string length,
    // just to make the UI look realistic until Phase 3.
    const mockScore = scan.product?.name ? (scan.product.name.length * 7) % 100 : 50;
    let grade: "A" | "B" | "C" | "D" = "C";
    let status: "safe" | "caution" | "flag" = "caution";
    let statusText = "Moderate concern";

    if (mockScore >= 80) {
      grade = "A"; status = "safe"; statusText = "No flagged additives";
    } else if (mockScore >= 60) {
      grade = "B"; status = "safe"; statusText = "Generally safe";
    } else if (mockScore >= 40) {
      grade = "C"; status = "caution"; statusText = "Check ingredients";
    } else {
      grade = "D"; status = "flag"; statusText = "High concern";
    }

    return {
      id: scan.id,
      name: scan.product?.name || "Unknown Product",
      brand: scan.product?.brand?.name || "Unknown Brand",
      grade,
      score: mockScore,
      status,
      statusText,
      scannedAgo: "Recently", // In a real app we'd use date-fns to format scan.createdAt
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
