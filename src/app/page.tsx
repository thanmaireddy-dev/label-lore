/**
 * Phase 0 — Foundation placeholder.
 *
 * This page exists only to confirm the project foundation is running:
 * fonts, design tokens, and Tailwind are wired up correctly.
 *
 * It will be replaced entirely in Phase 1 with the real landing page.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      {/* Token sanity check: every colour swatch uses a semantic Tailwind class */}
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-widest text-foreground-muted">
            Label Reader · Phase 0
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Project foundation is{" "}
            <span className="accent-italic text-primary">running.</span>
          </h1>
          <p className="text-base text-foreground-muted">
            Design tokens, fonts, and Tailwind are wired up. This placeholder
            will be replaced by the real landing page in Phase 1.
          </p>
        </div>

        {/* Design token swatches — visual proof that globals.css is loaded */}
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
            Semantic colour tokens
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Swatch name="background" hex="#FAFAF7" className="bg-background border border-border" />
            <Swatch name="surface" hex="#FFFFFF" className="bg-surface border border-border" />
            <Swatch name="primary" hex="#1B3A4B" className="bg-primary text-primary-foreground" />
            <Swatch name="foreground" hex="#16181C" className="bg-foreground text-surface" />
            <Swatch name="safe" hex="#1F8A5B" className="bg-safe text-surface" />
            <Swatch name="caution" hex="#B8791A" className="bg-caution text-surface" />
            <Swatch name="flag" hex="#B4432E" className="bg-flag text-surface" />
            <Swatch name="unknown" hex="#8A8D94" className="bg-unknown text-surface" />
          </div>
        </div>

        {/* Typography check */}
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
            Typography
          </p>
          <p className="text-xl font-semibold text-foreground">
            Inter — primary sans
          </p>
          <p className="text-xl text-foreground">
            Fraunces —{" "}
            <span className="accent-italic">accent italic only</span>
          </p>
        </div>

        <p className="text-xs text-foreground-muted text-center">
          Next.js {process.env.NEXT_PUBLIC_APP_VERSION ?? "16"} · React 19 ·
          TypeScript · Tailwind v4
        </p>
      </div>
    </main>
  );
}

/** Inline helper — only used in this placeholder, not a reusable component. */
function Swatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[var(--radius-control)] px-3 py-2 ${className}`}
    >
      <span className="font-mono text-xs">{name}</span>
      <span className="font-mono text-xs opacity-60">{hex}</span>
    </div>
  );
}
