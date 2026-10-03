import { cn } from "@/lib/utils";

/**
 * Card — composable surface primitive.
 *
 * Design spec §8: one base Card component (radius, border, shadow, padding)
 * composed into Scan Result Card, Ingredient Warning Card, Nutrition Card,
 * and Recent Scans Card via props/children.
 *
 * This is intentionally a thin wrapper — it provides visual consistency
 * (border, radius, shadow, padding) and nothing else. Content composition
 * happens at the call site.
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Removes default padding — useful when the card has full-bleed content. */
  noPadding?: boolean;
  /** Applies hover-lift effect (translateY + deeper shadow). */
  hoverable?: boolean;
}

export function Card({
  className,
  noPadding = false,
  hoverable = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]",
        !noPadding && "p-6",
        hoverable &&
          "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Card header — optional helper for consistent title/description layout. */
export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

/** Card title. */
export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/** Card content area — separated from header by default. */
export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-4", className)} {...props}>
      {children}
    </div>
  );
}
