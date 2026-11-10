import { HeroSection } from "@/components/hero/hero-section";
import { FeaturedScan } from "@/components/sections/featured-scan";
import { HowItWorks } from "@/components/sections/how-it-works";
import { RecentProducts } from "@/components/sections/recent-products";
import { CTABanner } from "@/components/sections/cta-banner";
import { Newsletter } from "@/components/sections/newsletter";
import { ProductService } from "@/features/products/product.service";

export const dynamic = "force-dynamic";

/**
 * Landing Page — Phase 1 & 2
 *
 * Assembles the single-column narrative layout per design spec §15.
 * Now fetches real data for Recent Scans via ScanService and FeaturedScan via ProductService.
 */
export default async function HomePage() {
  // Fetch the featured product; anonymous viewing history stays in each browser.
  const allProducts = await ProductService.getAllProducts(1);
  const featuredProductId = allProducts[0]?.id;
  const featuredProduct = featuredProductId 
    ? await ProductService.getProductById(featuredProductId) 
    : null;

  return (
    <>
      <HeroSection />
      {featuredProduct && <FeaturedScan product={featuredProduct} />}
      <HowItWorks />
      <RecentProducts />
      <CTABanner />
      <Newsletter />
    </>
  );
}
