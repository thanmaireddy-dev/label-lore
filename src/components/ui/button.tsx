import { cn } from "@/lib/utils";

/**
 * Button — primary and secondary button variants.
 *
 * Design spec §9:
 *   Primary: 40–44px tall, 8–10px radius, solid ink-teal, white text
 *   Secondary: same size, transparent, 1px border
 *   Ghost: transparent, subtle bg on hover
 *
 * States per §9:
 *   Hover: primary darkens ~8–10%; secondary fills with faint tint
 *   Active: scale(0.98) micro-feedback
 *   Disabled: 40–50% opacity
 *   Focus-visible: handled by global :focus-visible in globals.css
 */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-foreground/5 active:scale-[0.98]",
  ghost:
    "bg-transparent text-foreground hover:bg-foreground/5 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-3 text-xs",
  lg: "h-12 px-6 text-base",
  icon: "size-10",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
