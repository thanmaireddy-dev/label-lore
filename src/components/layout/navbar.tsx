"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScanLine,
  Search,
  User,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Navbar — sticky, blur-on-scroll, icon-led navigation.
 *
 * Design spec §5:
 *   - Logo left, text nav links center-left, icons + primary CTA right
 *   - 64–72px tall, sticky, blur-on-scroll, hairline bottom border
 *   - Mobile: collapses to logo + hamburger with slide-out overlay
 *
 * Scroll behavior:
 *   - Below ~40px: transparent background
 *   - Past ~40px: backdrop-blur + hairline border + subtle bg tint
 */

const navLinks = [
  { href: "/scan", label: "Scan" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll(); // check initial state
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 right-0 left-0 z-50 flex h-[var(--space-nav-height)] items-center transition-all duration-200",
          isScrolled
            ? "border-b border-border bg-background/80 backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          >
            <ScanLine className="size-6 text-primary" strokeWidth={1.75} />
            <span className="text-lg font-semibold tracking-tight">
              Label Reader
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right-side controls */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/scan"
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              aria-label="Search"
            >
              <Search className="size-[18px]" strokeWidth={1.75} />
            </Link>
            <button
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground cursor-not-allowed opacity-50"
              aria-label="Account (Coming Soon)"
              title="Authentication coming soon"
            >
              <User className="size-[18px]" strokeWidth={1.75} />
            </button>
            <Link
              href="/scan"
              className="ml-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] h-11 px-5 text-sm font-medium bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
            >
              <ScanLine className="size-4" strokeWidth={1.75} />
              Scan a label
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-foreground-muted transition-colors hover:bg-foreground/5 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out panel */}
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-surface shadow-[var(--shadow-elevated)]">
            <div className="flex h-[var(--space-nav-height)] items-center justify-between px-5">
              <span className="text-sm font-medium text-foreground-muted">
                Menu
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-foreground-muted transition-colors hover:bg-foreground/5"
                aria-label="Close menu"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="border-t border-border px-4 py-4">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <Link
                  href="/scan"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] h-11 px-5 text-sm font-medium bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
                >
                  <ScanLine className="size-4" strokeWidth={1.75} />
                  Scan a label
                </Link>
                <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed">
                  <User className="size-4" strokeWidth={1.75} />
                  Account (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
