"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { StatusPill } from "@/components/ui/status-pill";

/**
 * RecentScans — horizontal carousel with prev/next arrow controls.
 *
 * Design spec §4/§8: the "Recent test data" section is a horizontal-
 * scrolling carousel with arrow controls. Cards are ~280–320px fixed width.
 * scroll-snap, arrows disable at start/end.
 *
 * Desktop: 3–4 cards visible. Tablet: 2. Mobile: 1 with peek.
 */

const mockScans = [
  {
    id: "1",
    name: "Maggi Masala Noodles",
    brand: "Nestlé India",
    grade: "C",
    score: 58,
    status: "caution" as const,
    statusText: "High sodium",
    scannedAgo: "2 hours ago",
  },
  {
    id: "2",
    name: "Amul Dark Chocolate",
    brand: "Amul",
    grade: "B",
    score: 74,
    status: "safe" as const,
    statusText: "No flagged additives",
    scannedAgo: "5 hours ago",
  },
  {
    id: "3",
    name: "Britannia Good Day Biscuits",
    brand: "Britannia",
    grade: "C",
    score: 52,
    status: "flag" as const,
    statusText: "Contains TBHQ",
    scannedAgo: "1 day ago",
  },
  {
    id: "4",
    name: "Haldiram's Aloo Bhujia",
    brand: "Haldiram's",
    grade: "D",
    score: 38,
    status: "flag" as const,
    statusText: "High saturated fat",
    scannedAgo: "1 day ago",
  },
  {
    id: "5",
    name: "Paper Boat Aam Panna",
    brand: "Paper Boat",
    grade: "B",
    score: 71,
    status: "caution" as const,
    statusText: "Added sugar (12g)",
    scannedAgo: "2 days ago",
  },
  {
    id: "6",
    name: "Organic Tattva Brown Rice",
    brand: "Organic Tattva",
    grade: "A",
    score: 92,
    status: "safe" as const,
    statusText: "No flagged additives",
    scannedAgo: "3 days ago",
  },
];

const gradeColors: Record<string, string> = {
  A: "text-safe bg-safe-bg",
  B: "text-safe bg-safe-bg",
  C: "text-caution bg-caution-bg",
  D: "text-flag bg-flag-bg",
};

const statusIcons: Record<string, typeof ShieldCheck> = {
  safe: ShieldCheck,
  caution: AlertTriangle,
  flag: AlertTriangle,
};

export function RecentScans() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 300;
    el.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
    // Debounced check
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="bg-background py-24 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Section header with carousel controls */}
        <motion.div
          className="mb-10 flex items-end justify-between md:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <div className="max-w-2xl">
            <motion.p
              variants={fadeUp}
              className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-foreground-muted"
            >
              Recent scans
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
              style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
            >
              Check out{" "}
              <span className="accent-italic">recent results.</span>
            </motion.h2>
          </div>

          {/* Desktop carousel arrows */}
          <motion.div
            variants={fadeUp}
            className="hidden items-center gap-2 md:flex"
          >
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition-all hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:hover:bg-surface"
              aria-label="Previous scans"
            >
              <ChevronLeft className="size-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition-all hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:hover:bg-surface"
              aria-label="Next scans"
            >
              <ChevronRight className="size-4" strokeWidth={2} />
            </button>
          </motion.div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:-mx-0 md:gap-5 md:px-0"
          >
            {mockScans.map((scan) => {
              const Icon = statusIcons[scan.status] ?? ShieldCheck;
              return (
                <div
                  key={scan.id}
                  className="w-[280px] shrink-0 snap-start rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] sm:w-[300px]"
                >
                  {/* Header: grade badge + time */}
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`inline-flex size-9 items-center justify-center rounded-lg text-sm font-bold ${gradeColors[scan.grade]}`}
                    >
                      {scan.grade}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {scan.scannedAgo}
                    </span>
                  </div>

                  {/* Product info */}
                  <h3 className="mb-0.5 text-sm font-semibold text-foreground line-clamp-1">
                    {scan.name}
                  </h3>
                  <p className="mb-3 text-xs text-foreground-muted">
                    {scan.brand}
                  </p>

                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-xs text-foreground-muted">
                      <span>Score</span>
                      <span>{scan.score}/100</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-flag via-caution to-safe"
                        style={{ width: `${scan.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Status pill */}
                  <StatusPill
                    variant={scan.status}
                    icon={<Icon className="size-3.5" strokeWidth={1.75} />}
                  >
                    {scan.statusText}
                  </StatusPill>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
