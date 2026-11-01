"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import Link from "next/link";
import { ProductGrade } from "@/components/analysis/product-grade";

// The Scan data structure expected by the UI
export interface RecentScanItem {
  id: string;
  productId: string | null;
  name: string;
  brand: string;
  scannedAgo: string;
}

interface RecentScansProps {
  scans: RecentScanItem[];
}

export function RecentScans({ scans }: RecentScansProps) {
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

  if (scans.length === 0) return null;

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
            {scans.map((scan) => {
              return (
                <Link
                  href={`/scan/${scan.id}`}
                  key={scan.id}
                  className="block w-[280px] shrink-0 snap-start rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] sm:w-[300px]"
                >
                  {/* Persisted grade + time */}
                  <div className="mb-4 flex items-center justify-between">
                    {scan.productId ? <ProductGrade productId={scan.productId} compact /> : <span className="text-xs text-foreground-muted">No linked product</span>}
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

                  <p className="text-xs text-foreground-muted">Nutrition profile assessment</p>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
