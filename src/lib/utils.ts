import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — class-name utility.
 *
 * Combines clsx (conditional class logic) with tailwind-merge (conflict
 * resolution for Tailwind classes). This prevents bugs like:
 *   cn("px-2", "px-4") → "px-4"  ✓  (not "px-2 px-4" which breaks layout)
 *
 * Usage:
 *   <div className={cn("base-class", isActive && "active-class", className)} />
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
