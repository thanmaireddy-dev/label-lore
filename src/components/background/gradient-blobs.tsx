/**
 * GradientBlobs — decorative SVG background art.
 *
 * Design spec §7: 2–3 overlapping blurred SVG radial-gradient blobs
 * in low-opacity ink-teal tints, positioned behind the hero content.
 * filter: blur(60–100px), plus optional noise overlay.
 *
 * Theme-aware via CSS custom properties — no hardcoded colors.
 * aria-hidden since purely decorative.
 */

interface GradientBlobsProps {
  className?: string;
}

export function GradientBlobs({ className }: GradientBlobsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        className="absolute -top-20 left-1/2 h-[800px] w-[1200px] -translate-x-1/2"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="blob1" cx="30%" cy="25%" r="50%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blob2" cx="70%" cy="60%" r="45%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blob3" cx="50%" cy="10%" r="40%">
            <stop offset="0%" stopColor="var(--color-safe)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-safe)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Primary large blob — top-left bias */}
        <ellipse
          cx="380"
          cy="200"
          rx="450"
          ry="350"
          fill="url(#blob1)"
          style={{ filter: "blur(80px)" }}
        />

        {/* Secondary blob — bottom-right */}
        <ellipse
          cx="820"
          cy="480"
          rx="380"
          ry="280"
          fill="url(#blob2)"
          style={{ filter: "blur(100px)" }}
        />

        {/* Accent blob — top-center, subtle green hint */}
        <ellipse
          cx="600"
          cy="80"
          rx="300"
          ry="200"
          fill="url(#blob3)"
          style={{ filter: "blur(60px)" }}
        />
      </svg>

      {/* Noise/grain overlay — 3–5% opacity for texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
}
