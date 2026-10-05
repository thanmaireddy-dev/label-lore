import Link from "next/link";
import { ScanLine } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * Footer — minimal, trust-forward footer.
 *
 * Follows the same single-column narrative structure as the rest of the
 * page. Two rows: navigation links, then copyright/attribution.
 */

const footerLinks = {
  product: [
    { href: "/scan", label: "Scan a label" },
    { href: "/#recent-scans", label: "Scan history" },
    { href: "/#", label: "Insights (Coming Soon)", disabled: true },
  ],
  resources: [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#", label: "Methodology (Coming Soon)", disabled: true },
    { href: "/#", label: "FAQ (Coming Soon)", disabled: true },
  ],
  legal: [
    { href: "/#", label: "Privacy (Coming Soon)", disabled: true },
    { href: "/#", label: "Terms (Coming Soon)", disabled: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        {/* Top row: logo + link columns */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground"
            >
              <ScanLine className="size-5 text-primary" strokeWidth={1.75} />
              <span className="text-base font-semibold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-foreground-muted">
              {siteConfig.description}
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Product
            </p>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${link.disabled ? 'text-foreground-muted/50 cursor-not-allowed' : 'text-foreground-muted hover:text-foreground'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Resources
            </p>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${link.disabled ? 'text-foreground-muted/50 cursor-not-allowed' : 'text-foreground-muted hover:text-foreground'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Legal
            </p>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${link.disabled ? 'text-foreground-muted/50 cursor-not-allowed' : 'text-foreground-muted hover:text-foreground'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row: copyright */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} {siteConfig.name}. Built for food
            label literacy in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
