"use client";

import { cn } from "@/lib/utils";

/**
 * StatusPill — semantic status badge.
 *
 * Design spec §9: fully-rounded, tinted background at ~12% opacity of the
 * semantic color with full-strength text. Used for ingredient warnings,
 * scan statuses, claim verification results.
 *
 * Every pill pairs color with text (and optionally an icon) — never color
 * alone — per accessibility requirements in §14.
 */

type PillVariant = "safe" | "caution" | "flag" | "unknown" | "primary";

const variantStyles: Record<PillVariant, string> = {
  safe: "bg-safe-bg text-safe",
  caution: "bg-caution-bg text-caution",
  flag: "bg-flag-bg text-flag",
  unknown: "bg-unknown-bg text-unknown",
  primary: "bg-primary/10 text-primary",
};

interface StatusPillProps {
  variant: PillVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function StatusPill({
  variant,
  children,
  icon,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0 [&>svg]:size-3.5">{icon}</span>}
      {children}
    </span>
  );
}
