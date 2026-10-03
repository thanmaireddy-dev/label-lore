import { HeroSection } from "@/components/hero/hero-section";
import { FeaturedScan } from "@/components/sections/featured-scan";
import { HowItWorks } from "@/components/sections/how-it-works";
import { RecentScans } from "@/components/sections/recent-scans";
import { CTABanner } from "@/components/sections/cta-banner";
import { Newsletter } from "@/components/sections/newsletter";

/**
 * Landing Page — Phase 1
 *
 * Assembles the single-column narrative layout per design spec §15:
 * Hero → Featured Scan → How it works → Recent Scans → CTA → Newsletter
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedScan />
      <HowItWorks />
      <RecentScans />
      <CTABanner />
      <Newsletter />
    </>
  );
}
