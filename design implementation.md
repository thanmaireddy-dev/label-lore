# Label Reader â€” Design Reference Specification
### Reverse-engineered design language from forcanopy.com, adapted into an original visual system

**How to read this document:** every claim is tagged `[OBSERVED]` or `[ESTIMATED]`.
`[OBSERVED]` means it was pulled directly from the live, rendered page content and markup structure (section order, copy patterns, component semantics, badge states, nav items, italic-emphasis typography, carousel controls, light/dark logo variants).
`[ESTIMATED]` means no computed-CSS/screenshot inspector was available in this environment, so the number is an informed estimate based on the observed component's role, internal proportion logic, and conventions for this specific design genre (editorial, trust-forward, fintech-adjacent SaaS â€” the Ramp/Arc/Mercury/Watershed school of design). Treat estimated pixel values as **starting points for Antigravity to refine visually**, not measured ground truth.

Nothing in this document reproduces Canopy's actual copy, logo, brand colors as exact values, or content. It captures the *system* â€” proportions, hierarchy, component patterns, motion language â€” and reapplies it to an original product.

---

## 1. OVERALL DESIGN LANGUAGE

**Aesthetic:** Canopy reads as *editorial-scientific* rather than generic-SaaS. `[OBSERVED]` The homepage is built entirely around a single trust narrative â€” "independent lab testing, funded by everyone" â€” and every component reinforces that narrative: funding progress bars, "backers," lab-report badges, "Detected" / "No contaminants detected" states. This is the opposite of a feature-grid marketing site; it's closer to a Kickstarter crossed with a scientific journal.

**Design philosophy:** show the data, don't decorate around it. `[OBSERVED]` The hero leads with a search bar, not a video or illustration. The "how it works" section is four short numbered steps, no icons implied by the text extraction beyond numerals. The "recent test data" section immediately shows real specimen cards (product name, brand, contaminant status) rather than testimonials or logos. This is a pattern common to premium fintech/data products: *credibility through specificity*, not through visual flourish.

**Emotional impression:** calm authority. Not alarmist (even though the subject matter â€” contaminants in food â€” could easily be sensationalized), not cold/clinical either. `[OBSERVED]` The copy is measured ("neutral scientists with no stake in the results," "plain-language context on what the numbers mean") â€” this is a deliberate anti-fearmongering tone that a visual system should match: no aggressive reds-everywhere, no siren iconography.

**Visual hierarchy:** `[OBSERVED]` Single dominant headline â†’ one-paragraph explainer â†’ single search action â†’ single secondary link. Every section on the page follows this same "one big idea, one supporting sentence, one card grid or list" rhythm. This restraint is what reads as premium â€” there's no competing CTA, no more-than-one accent color fighting for attention.

**Why it feels premium/polished:**
1. **Restrained color use** `[ESTIMATED]` â€” almost certainly a near-monochrome neutral palette (off-white/cream background, near-black text) with a single accent color reserved for interactive elements and status.
2. **Typographic contrast as decoration** `[OBSERVED]` â€” italic serif words dropped into an otherwise plain sans headline ("published *lab data.*", "recent *results.*", "*your* food") do the emotional work that a full illustration would do on a lesser site. This is a well-known technique (Arc Browser, Ramp, Linear-adjacent studios use it) â€” it signals "we have a design system" cheaply and effectively.
3. **Real data in cards, not stock imagery** `[OBSERVED]` â€” the recent-results carousel shows real product names, real detected chemicals, real screening ratios ("4 of 592 screened"). Specificity reads as expensive/considered even when the visual chrome is simple.
4. **Generous whitespace between sections** `[ESTIMATED]` â€” the page has clearly delineated section breaks (Featured â†’ How it works â†’ Recent test data â†’ CTA â†’ Newsletter â†’ Footer) each acting as its own "chapter," implying large vertical section padding (see Â§4).

**Whitespace usage:** `[ESTIMATED]` Whitespace is used structurally (separating narrative beats) more than decoratively (there's no oversized negative space around a hero graphic, because there isn't a hero graphic beyond a background treatment + search bar). This is a *content-dense* premium site, not a *minimal* one â€” closer to Stripe's homepage density than to a luxury-brand microsite.

**Modern/editorial/SaaS blend:** editorial typography (serif italic accents, mixed case, longform explainer sentences) + SaaS interaction patterns (search bar as primary CTA, progress bars, status pills, carousel) + product-data density (real specimen cards). This three-way blend â€” magazine headline, fintech dashboard card, e-commerce browse grid â€” is what should be reproduced structurally for Label Reader, without reusing Canopy's literal content.

**What makes it different from generic SaaS:** most SaaS homepages open with "Feature. Feature. Feature. Testimonial. Pricing." Canopy opens with a *search bar* as the primary hero action `[OBSERVED]`, treating the homepage more like a product surface (browse/search) than a landing page. That's the single most important structural takeaway to carry into Label Reader.

---

## 2. COLOR SYSTEM

`[ESTIMATED â€” no computed styles available]`. Based on the "light" mode-toggle label `[OBSERVED]` and dual light/dark logo assets `[OBSERVED]`, the site supports both themes; light is default. For a site in this genre, the palette is almost certainly:

| Role | Approx. value | Purpose | Notes |
|---|---|---|---|
| Background | `#FAFAF8` â€“ `#F7F6F2` (warm off-white, not pure white) | Page background | Warm neutrals read as "editorial paper," not "app chrome" |
| Surface / card | `#FFFFFF` | Card backgrounds sitting on the warm background | Slight contrast lift, not a hard white-on-white |
| Foreground / text primary | `#14151A` â€“ `#1A1B1F` (near-black, slightly warm) | Headlines, body | True `#000` reads harsh; near-black is standard premium practice |
| Muted text | `#6B6D76` | Secondary copy, metadata, timestamps | e.g. "18 days left," "6 backers" |
| Border | `#E8E7E2` â€“ `#ECEBE6` | Card borders, dividers, input outlines | Hairline, warm-neutral, barely visible |
| Primary / accent | A single deep tone â€” likely deep green or forest ("Canopy" = tree canopy) | Primary buttons, active states, links | Brand-specific; do not copy the literal hue |
| Success | Green, `#1F8A5B`-ish | "No contaminants detected" pill | `[OBSERVED behavior, ESTIMATED hex]` |
| Warning/Alert | Amber or red, `#B4432E`-ish or amber `#B8791A`-ish | "Detected" pill (contaminant found) | Deliberately not neon-red â€” matches the calm-authority tone |
| Funding accent | Same as primary or a distinct progress-bar color | Progress bar fill (`22%`, `$60 of $276`) | |

**Design tokens to define:**
```
--color-background
--color-surface
--color-surface-elevated   (cards that sit above surface, e.g. modals)
--color-foreground
--color-foreground-muted
--color-border
--color-border-subtle
--color-primary
--color-primary-foreground
--color-accent
--color-success
--color-success-bg         (tinted pill background, e.g. success at 10% opacity)
--color-warning
--color-warning-bg
--color-danger
--color-danger-bg
```

**Adapting for Label Reader â€” don't copy, reinterpret:** Canopy's core metaphor is a tree/canopy (protection, growth), which likely drives a green primary. Label Reader's metaphor is *legibility / clarity* â€” seeing clearly what's in a product. Recommended original direction:

- **Primary:** a deep ink-blue or deep teal (`#1B3A4B`-ish) â€” evokes clarity/trust without borrowing Canopy's green-forest association.
- **Semantic colors carry the real design weight** in Label Reader, more than in Canopy, because the entire product is a risk-communication tool:
  - `--color-safe` (green) â€” ingredient/product flagged clean
  - `--color-caution` (amber) â€” moderate concern (e.g., added sugar, sodium threshold)
  - `--color-flag` (red/terracotta, not pure alarm-red) â€” allergen or concerning additive
  - `--color-unknown` (neutral gray) â€” insufficient data
- Keep the same *restraint principle* Canopy uses: one accent color for interaction, a small closed set of semantic colors for status, everything else neutral.

---

## 3. TYPOGRAPHY

`[OBSERVED]` The homepage copy contains explicit italic emphasis on specific words within otherwise upright sans-serif sentences:
- "From a question on the shelf to *published lab data.*"
- "Check out *recent results.*"
- "Curious what's *your* food?"

This is a strong, confident signal: **the display type system is a sans-serif base with an italic serif (or italic-variant sans) used only for 1â€“3 word emphasis phrases inside headlines.** This is a widely used 2024â€“2026 "editorial-tech" pattern (seen in Ramp, Arc, Watershed, Linear's marketing pages).

**Recommended real-world pairing** (structurally equivalent, not the same fonts):
- **Display/heading sans:** `Geist` or `Inter` (tight tracking, weight 500â€“600 for headlines) â€” `[ESTIMATED]` letter-spacing around `-0.02em` for large sizes (standard for tightening big type).
- **Italic accent face:** a serif with a graceful italic â€” `Newsreader`, `Fraunces` (italic), or `Source Serif 4 italic`. Used *only* for emphasized headline fragments, never for body copy or UI text.
- **Body font:** same sans as headings, regular weight, slightly larger line-height for readability (paragraph copy like the hero's contaminant-explainer sentence is a full sentence, not a fragment â€” `[OBSERVED]` it runs ~140 characters, roughly 2 lines at typical hero paragraph widths).
- **Navigation/UI font:** same sans, smaller size, often uppercase-tracked for section labels like "Featured," "How it works," "Recent test data" `[OBSERVED â€” these read as section eyebrows/labels, a common uppercase-micro-label pattern]`.

**Heading hierarchy (estimated px, desktop):**
| Level | Size | Weight | Line-height | Notes |
|---|---|---|---|---|
| Hero H1 | 56â€“72px | 500â€“600 | 1.05â€“1.1 | Tight leading typical of big display type |
| Section H2 | 32â€“40px | 500â€“600 | 1.15 | e.g. "How it works," "Recent test data" headlines |
| Card title | 16â€“18px | 500â€“600 | 1.3 | Product names in cards |
| Body / paragraph | 16â€“18px | 400 | 1.5â€“1.6 | Explainer sentences |
| Eyebrow/label | 12â€“13px | 500, uppercase, tracked +0.06em | 1.2 | "Featured," "How it works" |
| Metadata/muted | 13â€“14px | 400 | 1.4 | "18 days left," "2 backers" |

**Hero typography deep-dive:** `[OBSERVED]` the hero headline is a single sentence spanning what reads as 2 lines ("Independent lab testing, funded by everyone") â€” no italic accent in the H1 itself; the italic treatment shows up in the *secondary* headlines further down the page ("published *lab data.*"). This suggests a **hierarchy rule**: the hero H1 is plain/upright for maximum clarity and authority; italic accents are reserved for the more narrative mid-page headlines. Carry this exact rule into Label Reader â€” don't italicize the primary hero line, save the serif-italic move for section headers.

**Practical implementation:**
```css
:root {
  --font-sans: 'Geist', 'Inter', system-ui, sans-serif;
  --font-serif-italic: 'Fraunces', 'Newsreader', Georgia, serif;
}
h1 { font-family: var(--font-sans); font-weight: 560; letter-spacing: -0.02em; line-height: 1.08; }
.accent-italic { font-family: var(--font-serif-italic); font-style: italic; font-weight: 400; }
```
In React: wrap only the emphasized fragment in a `<span className="accent-italic">` â€” never the whole heading.

---

## 4. LAYOUT SYSTEM

`[ESTIMATED]` Typical for this genre of site:

| Property | Desktop | Tablet | Mobile |
|---|---|---|---|
| Max content width | 1200â€“1280px | 100% with 32â€“48px gutters | 100% with 16â€“20px gutters |
| Page horizontal margin | 24â€“32px beyond max-width container | 32px | 16â€“20px |
| Navbar height | 64â€“72px | 64px | 56â€“60px |
| Section vertical padding | 96â€“128px top/bottom | 72â€“96px | 48â€“64px |
| Card grid gap | 20â€“24px | 16â€“20px | 12â€“16px |
| Hero top padding (below nav) | 80â€“120px | 56â€“72px | 40â€“48px |

**Hero layout:** `[OBSERVED]` single-column, center-weighted content (eyebrow label â†’ H1 â†’ paragraph â†’ search field â†’ secondary link), no split-screen image/text layout evident in the text extraction â€” meaning the hero is likely **text + search bar over a background treatment**, not a two-column hero-image layout. Paragraph width is likely capped around **560â€“640px** `[ESTIMATED]` so the explainer sentence wraps to exactly 2â€“3 lines regardless of headline width â€” a classic readability constraint.

**Card grid / carousel section ("Recent test data"):** `[OBSERVED]` this is a **horizontal-scrolling carousel with prev/next arrow controls** (`â† â†’` observed), not a wrapping CSS grid â€” cards likely have a fixed width (`~280â€“320px` `[ESTIMATED]`) and the container uses `overflow-x: auto` with scroll-snap, common for "browse recent items" rails.

**Featured section:** a single, larger card `[OBSERVED â€” labeled "Featured" and shown before the numbered how-it-works section]`, likely full-width or near-full-width within the container, functioning as a hero-adjacent highlight before the explainer content.

**Vertical rhythm:** the page reads as a strict single-column narrative (no sidebar, no multi-column dashboard on the homepage) â€” `Hero â†’ Featured â†’ How it works (4-step) â†’ Recent results (carousel) â†’ CTA banner â†’ Newsletter â†’ Footer`. This linear chapter structure is the single most portable layout takeaway.

**Responsive behavior (estimated):**
- **Desktop (1440px+):** full nav row, hero paragraph capped ~600px, 4-step "how it works" likely in a 4-column or 2Ã—2 grid, carousel shows 3â€“4 cards at once.
- **Tablet (768â€“1439px):** nav simplifies (icons may collapse into a menu), how-it-works likely drops to 2Ã—2 or a vertical stack, carousel shows 2 cards.
- **Mobile (<768px):** nav becomes a hamburger (`[OBSERVED]` â€” the text extraction literally includes "Close menu," confirming a slide-out/overlay mobile nav exists), how-it-works becomes a single vertical stack of 4 numbered rows, carousel shows 1 card with edge-peek of the next, all section padding compresses to the 48â€“64px range.

---

## 5. NAVIGATION

`[OBSERVED]` Nav contents, in order: logo (home link) â†’ search icon/link â†’ cart icon/link â†’ theme toggle ("light") â†’ mobile hamburger with a "Close menu" state. No visible primary text nav items (no "Product / Pricing / About" links surfaced in the extraction) â€” the nav is icon-led and minimal, which fits the "homepage as product surface" philosophy from Â§1.

**Estimated dimensions:**
- Nav height: 64â€“72px `[ESTIMATED]`
- Logo mark height: ~24â€“28px `[ESTIMATED]`
- Icon buttons: 36â€“40px square hit target, 18â€“20px icon inside `[ESTIMATED]`
- Spacing between nav-right icons: 12â€“16px `[ESTIMATED]`
- Border radius on icon buttons: fully rounded (circle) or 8px squircle `[ESTIMATED]`
- No visible shadow on the nav bar itself; likely a hairline bottom border or none, with a background blur (`backdrop-filter: blur()`) on scroll â€” standard for sticky navs in this genre `[ESTIMATED]`.
- Active/hover state: subtle background tint (`bg-foreground/5`) on icon buttons, no underline nav links observed since there are no text links in the primary nav.

**Proposed nav for Label Reader:**
```
[Logo: "Label Reader"]        [Scan]  [History]  [Insights]        [ðŸ” search] [ðŸŒ“ theme] [ðŸ‘¤ account]  [Scan a label â†’] (primary button)
```
- Keep the icon-led minimalism on the right (search, theme, account) but add 2â€“3 lightweight text nav items in the center-left since Label Reader has distinct destinations (Scan, History, Insights/Dashboard) that Canopy's single-purpose homepage didn't need.
- Primary CTA button ("Scan a label") pinned nav-right, filled with `--color-primary`, height ~40px, radius 8â€“10px, matching button spec in Â§9.
- Sticky nav with blur-on-scroll, hairline bottom border at `--color-border`.

---

## 6. HERO SECTION

`[OBSERVED]` Structure, top to bottom:
1. Eyebrow label: "Canopy Â· Crowdfunded contaminant testing" (small, muted, likely uppercase-tracked or just small-caps-style sentence case with a middle-dot separator)
2. H1: "Independent lab testing, funded by everyone" â€” plain sans, no italic
3. Body paragraph (~2 sentences, ~140 characters): explains the mechanism
4. A **search input** as the primary interactive element (not a button â€” literally "Search")
5. Secondary link: "Learn more about how it works â†’" (arrow-suffixed text link, not a button)

**Dimensions (estimated):** H1 spans roughly the paragraph's width or slightly wider, likely capped at **~720â€“800px** so it wraps to 2 lines at desktop sizes `[ESTIMATED]`. Paragraph capped narrower, ~560â€“620px `[ESTIMATED]`, centered under/left-aligned with the H1 (text extraction doesn't confirm center vs. left align, but the single-column narrative style of the rest of the page makes **left-aligned, container-left** more likely than a centered marketing hero â€” center-aligned hero+paragraph is more common when there's no search bar directly below; a search bar as a UI element usually implies a left-aligned, product-like hero).

**No hero image/illustration was detected in the extraction** â€” meaning the visual interest in the hero comes entirely from (a) the background art treatment (Â§7) and (b) typography, not from a product screenshot or illustration. This is an important structural takeaway: **the search bar itself is the "hero visual."**

**CTA/search positioning:** search field sits directly below the paragraph, full-width-of-content-column or a fixed max-width (~480â€“560px `[ESTIMATED]`), likely with a search icon prefix and no visible submit button (Enter-to-search), consistent with a minimal product-search-bar aesthetic.

### Adapting the hero to Label Reader

Do **not** reuse Canopy's literal headline. Structurally equivalent, original hero for Label Reader:

- **Eyebrow:** "Label Reader Â· Know what you're eating"
- **H1 (plain sans, no italic, 2 lines):**
  > "Understand what's
  > inside your food."
- **Paragraph (~560px cap):** something like: "Ingredient lists are long and full of jargon. Scan a label and get a plain-language breakdown of additives, allergens, and nutrition â€” in seconds."
- **Primary hero action:** since Label Reader's core verb is *scan*, not *search*, replace the search bar with a **drag-and-drop / tap-to-scan upload field** styled with the same visual weight Canopy gives its search bar (bordered input-like surface, icon-left, placeholder text: "Drop a label photo or paste a product name"). This mirrors Canopy's "the input IS the hero visual" trick while being functionally correct for the product.
- **Secondary link:** "See how scanning works â†’" (same arrow-suffix text-link pattern).
- **Background:** organic abstract shape treatment per Â§7, in Label Reader's ink-blue/teal accent instead of Canopy's likely green.

---

## 7. BACKGROUND ART / ABSTRACT SHAPES

`[ESTIMATED â€” not directly visible in text extraction; inferred from genre convention and the brand name "Canopy," which strongly implies organic/leaf-like abstract shapes are used somewhere on the page, most likely behind the hero]`.

Sites in this genre (trust/science/editorial SaaS with a nature-adjacent brand name) most commonly implement background art as:
- **Layered blurred SVG blobs** with soft gradient fills, `filter: blur(60â€“100px)`, positioned absolutely behind the hero content, at low opacity (15â€“30%) so text contrast is preserved.
- **Not raster images** â€” almost certainly vector/CSS-based so it scales cleanly and supports the light/dark theme swap (`[OBSERVED]` dual light/dark logo assets confirm theme-awareness is a real requirement across the site, and background art would need to follow suit).
- Possibly combined with a **subtle grain/noise texture overlay** (very common 2024â€“2026 technique to keep flat gradients from looking cheap/banding) via an `<svg>` feTurbulence filter or a tiled PNG noise texture at ~3â€“5% opacity.

**Practical implementation guidance (for Antigravity):**
```html
<div class="hero-bg" aria-hidden="true">
  <svg viewBox="0 0 1200 800" class="blob-layer">
    <defs>
      <radialGradient id="g1" cx="30%" cy="20%">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="300" cy="150" rx="420" ry="320" fill="url(#g1)" style="filter:blur(60px)"/>
  </svg>
</div>
```
```css
.hero-bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.hero-bg::after { /* noise overlay */
  content: ''; position: absolute; inset: 0; opacity: 0.04;
  background-image: url("data:image/svg+xml,...feTurbulence...");
  mix-blend-mode: overlay;
}
```
- Use 2â€“3 overlapping radial-gradient blobs, offset diagonally, each a different low-opacity tint of the primary/accent colors â€” never more than 2 hues in the background art or it starts competing with foreground content.
- For Label Reader, an organic-blob treatment still fits (it doesn't read as "Canopy-specific" â€” soft gradient blobs are a generic, widely-used technique), but shift the palette to ink-blue/teal and consider a subtle **magnifying-glass or scan-line motif** worked into the shapes at very low opacity as a more product-specific alternative if you want to differentiate further from the reference.

---

## 8. CARDS

`[OBSERVED]` Two distinct card types appear:

**A. Featured/campaign card** (larger, single instance): product name + brand + test type (e.g. "Heavy Metals Panel") + status ("Active") + funding percentage + dollar progress ("$60.00 of $276.00") + days remaining + backer count.

**B. Result card** (small, repeated in carousel): product name + test type + status pill ("Funded") + brand + result badge ("Detected [chemical name]" or "No contaminants detected") + screening ratio ("1 of 2 screened") + backer count.

**Estimated card specs:**
| Property | Featured card | Result card (carousel) |
|---|---|---|
| Width | full container or ~2/3 width | 280â€“320px fixed |
| Height | auto, ~200â€“260px | auto, ~220â€“280px |
| Border radius | 16â€“20px | 12â€“16px |
| Background | `--color-surface` (white) | `--color-surface` |
| Border | 1px `--color-border` | 1px `--color-border` |
| Shadow | soft, `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)` | lighter version of the same |
| Padding | 24â€“28px | 16â€“20px |
| Title weight/size | 18â€“20px / 600 | 15â€“16px / 600 |
| Metadata size | 13â€“14px, muted | 12â€“13px, muted |
| Progress bar height | 6â€“8px, full-rounded, track in `--color-border`, fill in `--color-primary` | n/a (result cards show status pill instead of progress) |
| Status pill | rounded-full, 4â€“6px vertical padding / 10â€“12px horizontal, 12â€“13px text, semantic color background at ~12% opacity + full-strength text color | same |

**Reusable card system principle:** one base `Card` component (radius, border, shadow, padding token) with **slot-based content** â€” a card is really just "surface + optional image + title + metadata row + status pill row + optional progress bar." Build it as one component with composable children, not five different card components.

### Label Reader card translations

| Canopy card element | Label Reader equivalent |
|---|---|
| Featured campaign card | **Scan Result Card** â€” hero-sized card shown right after a scan: product photo/thumbnail, product name + brand, overall "Label Score" (0â€“100 or Aâ€“F), 3â€“4 top flags as pills |
| Funding progress bar | **Ingredient Safety Score bar** â€” a horizontal bar from redâ†’amberâ†’green showing overall product risk, filled to the score position |
| "Detected [chemical]" pill | **Ingredient Warning pill** â€” red/amber, e.g. "Contains: Red 40" or "High sodium" |
| "No contaminants detected" pill | **Clean pill** â€” green, "No flagged additives" |
| Result carousel card | **Recent Scans card** â€” thumbnail + product name + score badge + scanned-date, in a horizontal history rail |
| Backer count / screening ratio metadata | **Nutrition Summary strip** â€” calories Â· sugar Â· sodium Â· protein as small metadata chips under the product name |

---

## 9. BUTTONS AND CONTROLS

`[ESTIMATED]`:

| Control | Height | Radius | Padding-x | Fill | Border | Text |
|---|---|---|---|---|---|---|
| Primary button | 40â€“44px | 8â€“10px | 16â€“20px | `--color-primary` solid | none | white, 14â€“15px, 500 |
| Secondary button | 40â€“44px | 8â€“10px | 16â€“20px | transparent | 1px `--color-border` | `--color-foreground`, 14â€“15px |
| Text link w/ arrow | auto | n/a | n/a | none | none | `--color-foreground` or `--color-primary`, 14â€“15px, underline-on-hover, arrow (â†’) suffix that nudges right 2â€“4px on hover |
| Search/scan input | 48â€“52px | 10â€“12px (or full-pill, 999px) | 16px + icon | `--color-surface` | 1px `--color-border` | placeholder in muted color |
| Status pill/badge | 24â€“28px | full-rounded (999px) | 10â€“12px | tinted (12% opacity of semantic color) | none | semantic color, 12â€“13px, 500 |
| Icon button (nav) | 36â€“40px square | full-rounded or 8px | n/a | transparent, `bg-foreground/5` on hover | none | icon 18â€“20px |
| Carousel arrow button | 36â€“40px circle | full-rounded | n/a | white/surface with border | 1px border | icon 16â€“18px |

**States:**
- Hover: primary button darkens ~8â€“10%; secondary button fills with a faint tint of border color; text links underline; icon buttons get a faint background tint.
- Active/pressed: scale down very slightly (`transform: scale(0.98)`) â€” common tactile micro-feedback in this genre `[ESTIMATED]`.
- Disabled: 40â€“50% opacity, no pointer events, no hover state.
- Focus-visible: 2px outline in `--color-primary`, offset 2px â€” required regardless of what the reference site does, per Â§14.

---

## 10. ICONOGRAPHY

`[ESTIMATED]` The icon set implied (search, cart, theme toggle, hamburger, carousel arrows) points to a **line-icon style**, not filled: 1.5â€“1.75px stroke weight, rounded line caps/joins, 20â€“24px canvas, minimal detail â€” this is the dominant convention for products in this design tier (matches Lucide, Phosphor, Feather conventions).

- **Icon-to-text spacing:** 6â€“8px gap when icon precedes a text label `[ESTIMATED]`.
- **Corner style:** rounded joints throughout (no sharp/geometric icon style) to match the soft card radii and blob background treatment.

**Recommended library for implementation:** since your stack already includes **Lucide React**, use it directly â€” its stroke weight (1.5â€“2px default) and rounded-cap style matches this exact aesthetic with zero customization needed. Good candidates for Label Reader: `ScanLine`, `Camera`, `ShieldCheck`, `AlertTriangle`, `Leaf`, `FlaskConical`, `History`, `Search`.

---

## 11. SHADOWS, BORDERS AND DEPTH

`[ESTIMATED]` This design language uses **depth sparingly** â€” it's a flat, border-led system rather than a heavily-shadowed skeuomorphic one:

- Base elevation (cards on background): thin 1px border in `--color-border` + a *very* soft shadow (barely perceptible, mostly for edge anti-aliasing softness): `0 1px 2px rgba(16,16,16,0.04)`.
- Elevated elevation (dropdowns, popovers, the mobile nav overlay): a real shadow, `0 8px 30px rgba(16,16,16,0.12)`, no border needed at this level since the shadow itself creates separation.
- Floating elements (sticky nav on scroll): background blur + hairline bottom border rather than a shadow â€” shadows under a full-width nav bar tend to look dated in this genre.
- **Borders carry more of the "structure" work than shadows do** â€” this is the key insight: define your border-color token carefully (it's doing more visual work than in a shadow-heavy design system like Material).

---

## 12. ANIMATIONS AND MICROINTERACTIONS

`[ESTIMATED â€” no motion was directly observable via static fetch, but the component types imply standard patterns for this genre]`:

**Essential (implement these):**
- Card hover: subtle lift â€” `translateY(-2px)` + shadow deepens slightly, 150â€“200ms ease-out. Applies to result cards and the featured card.
- Button hover/press states per Â§9.
- Carousel: smooth scroll-snap on arrow click (`scroll-behavior: smooth`), arrows disable/fade at the start/end of the rail.
- Nav: blur-in on scroll past ~40px, 200ms.
- Status pill entrance when a scan result loads: fade + slight scale-in (0.95â†’1), 200ms â€” communicates "this data just arrived," fitting for a results-reveal moment (very relevant for Label Reader's scan-result flow).

**Optional (nice-to-have, don't block launch on these):**
- Progress bar fill animates from 0 to its value on scroll-into-view (200â€“500ms ease-out) â€” genuinely nice for the "Ingredient Safety Score" bar reveal.
- Background blobs given a very slow (20â€“40s), barely-perceptible drift animation (translate Â± 10â€“20px) for ambient life â€” skip if it risks distracting from label-safety content, which should feel calm, not busy.
- Page-section fade/slide-up on scroll (`opacity 0â†’1, translateY 16pxâ†’0`) for each major section â€” tasteful, common, low-risk.

**Framer Motion implementation sketch:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
```
Respect `prefers-reduced-motion` globally â€” wrap the above in a check and fall back to instant `opacity:1` with no transform.

---

## 13. RESPONSIVE DESIGN

`[ESTIMATED]`

**Desktop (1440px+):**
- Nav: full icon row visible.
- Hero: single column, paragraph capped ~600px, search/scan input at ~480â€“560px.
- Cards: carousel shows 3â€“4 cards at once; "how it works" as 4-column or 2Ã—2 grid.
- Typography at full scale (H1 ~64â€“72px).
- Background shapes at full size/opacity.

**Tablet (768â€“1439px):**
- Nav: may collapse text/extra icons into an overflow or keep icon-only row (already icon-led, so minimal change needed).
- Hero: same single-column structure, paragraph/input width scales to ~90% of a narrower container.
- Cards: carousel shows 2 cards; "how it works" drops to 2Ã—2.
- Typography scales down (H1 ~44â€“52px).
- Background shapes reduce in size/opacity slightly to avoid dominating a narrower viewport.

**Mobile (<768px):**
- Nav: collapses to logo + hamburger (`[OBSERVED â€” "Close menu" confirms this pattern exists]`) + maybe one primary icon (scan/search) kept visible; overlay menu slides in for the rest.
- Hero: paragraph/input become full-width minus gutter; H1 wraps to 2â€“3 lines at ~32â€“40px.
- Cards: carousel shows 1 card with a peek of the next (10â€“15% visible) to signal scrollability.
- Buttons: full-width primary CTA is common at this breakpoint even if desktop uses an inline button.
- Background shapes: simplified to fewer/smaller blobs or a single subtle gradient wash â€” full blob complexity often looks noisy on small screens.
- Section vertical padding compresses to 48â€“64px throughout.

---

## 14. ACCESSIBILITY

- **Contrast:** near-black text (`~#14151A`) on warm off-white (`~#FAFAF8`) comfortably clears WCAG AA for body text; verify the muted-text token (`#6B6D76`-ish) still clears **4.5:1** against both background and surface â€” muted grays are the most common accessibility failure point in this exact design style.
- **Semantic status colors** (safe/caution/flag) must never be the *only* signal â€” pair every colored pill with a text label and/or icon (Label Reader is a safety-communication tool; color-only signaling is both an accessibility failure and a genuine safety risk for colorblind users checking allergen flags).
- **Keyboard navigation:** carousel arrows, card links, and the scan/search input all need to be reachable and operable via keyboard; carousel should support arrow-key navigation when focused, not just click.
- **Focus states:** visible focus ring (2px, `--color-primary`, 2px offset) on every interactive element â€” buttons, pills-if-clickable, nav icons, carousel arrows.
- **Semantic HTML:** use `<nav>`, `<main>`, `<section>` with `aria-label`s per section ("How it works," "Recent scans"), real `<button>`/`<a>` elements (not `div onClick`), and a real `<progress>` or ARIA `role="progressbar"` with `aria-valuenow` for the safety-score bar.
- **Button/target sizes:** minimum 40Ã—40px hit area for icon buttons, even if the visual icon is smaller â€” matches the 36â€“40px estimate in Â§9.
- **Form labels:** the scan/upload input needs a real associated `<label>` (visually hidden is fine) â€” "Search" placeholder text alone is not a substitute for a label.
- **Responsive typography:** use `clamp()` for the H1 so it scales fluidly rather than jumping at breakpoints: `font-size: clamp(2rem, 5vw + 1rem, 4.5rem)`.
- **Reduced motion:** wrap all scroll-reveal and hover-lift animations in `@media (prefers-reduced-motion: reduce)` fallbacks per Â§12.

---

## 15. LABEL READER ADAPTATION

Stepping fully into the Label Reader product now â€” same design *quality tier* as Canopy, a distinct product identity.

**Color system:**
```
--color-background: #FAFAF7      /* warm off-white */
--color-surface: #FFFFFF
--color-foreground: #16181C
--color-foreground-muted: #6B6E76
--color-border: #E9E8E3
--color-primary: #1B3A4B          /* deep ink-teal â€” clarity, not alarm */
--color-primary-foreground: #FFFFFF
--color-safe: #1F8A5B
--color-safe-bg: #1F8A5B1F
--color-caution: #B8791A
--color-caution-bg: #B8791A1F
--color-flag: #B4432E
--color-flag-bg: #B4432E1F
--color-unknown: #8A8D94
```

**Typography system:** Geist/Inter sans for everything structural; Fraunces/Newsreader italic reserved for 1â€“3 word emphasis inside section headlines only (never the hero H1, per the rule observed in Â§3/Â§6).

**Navbar:** Logo left Â· "Scan" / "History" / "Insights" text links center-left Â· search icon, theme toggle, account icon, primary "Scan a label" button right. 64â€“72px tall, sticky, blur-on-scroll, hairline bottom border.

**Hero structure:** Eyebrow â†’ plain 2-line H1 ("Understand what's / inside your food.") â†’ ~600px-capped paragraph â†’ scan/upload input (styled as the hero's primary visual, same weight Canopy gives its search bar) â†’ secondary arrow-link ("See how scanning works â†’") â†’ ink-teal blob background art, low opacity, theme-aware.

**Card system:** one base `Card` primitive (16px radius, 1px border, soft shadow, 20â€“24px padding) composed into:
- **Scan Result Card** (the featured-card equivalent) â€” product photo, name/brand, big safety score + colored bar, top 3 flag pills.
- **Ingredient Warning Card** â€” single ingredient name, category (additive/allergen/sweetener), severity pill, one-sentence plain-language explanation.
- **Nutrition Summary Card** â€” calories, sugar, sodium, protein as a metadata chip row + a small bar/ring for %-daily-value on the 2â€“3 most notable metrics.
- **Recent Scans Card** (carousel-card equivalent) â€” thumbnail, product name, score badge, "scanned 2 days ago."

**Scan/upload interface (the hero's primary action, and its own dedicated page):** large dashed-border or soft-bordered dropzone, camera icon centered, "Drop a label photo, upload, or paste a product name" â€” mirrors the visual weight and centrality Canopy gives its search bar, but functionally a scan intake, not a search box. Include a fallback text-search field below it for users who don't have the physical product.

**Product analysis interface:** single-column narrative layout matching Canopy's homepage rhythm â€” Scan Result Card at top â†’ Ingredient Warning Cards listed below (worst-first ordering) â†’ Nutrition Summary Card â†’ "Full ingredient list" expandable section at the bottom. This mirrors Canopy's "hero claim â†’ supporting detail â†’ full data" chapter structure from Â§4.

**Ingredient warning cards:** color-coded left border or icon (not full-card color-wash, to avoid an alarming "the whole card is red" feeling) + severity pill + plain-language one-liner ("Red 40 â€” synthetic dye linked to hyperactivity concerns in some studies") â€” tone should match Canopy's measured, non-fearmongering copy voice from Â§1.

**Nutrition cards:** small multiples â€” 4â€“6 metric chips (calories, sugar, sodium, saturated fat, protein, fiber) each with value + a tiny inline bar showing position relative to a recommended daily threshold.

**Dashboard layout:** for a logged-in "Insights" view â€” summary stats up top (scans this month, most common flags), then a Recent Scans rail (carousel, same component as Â§8's translation), then a simple bar/line chart of scan-quality trend over time.

**History page:** a filterable list/grid of Scan Result Cards (compact variant â€” thumbnail + name + score badge + date), search + filter-by-flag-type controls at the top, matching the "browse" philosophy Canopy applies to its results page.

**Mobile layout:** hero collapses to a full-width scan dropzone as the first thing visible below a minimal logo+hamburger nav (the dropzone *is* the mobile hero â€” no separate headline+input stacking needed if space is tight); Scan Result Card and Ingredient Warning Cards stack full-width; Recent Scans becomes a single-card-with-peek horizontal rail per Â§13.

---

## 16. TECHNICAL IMPLEMENTATION RECOMMENDATION

**Stack:** Next.js (App Router) Â· React Â· TypeScript Â· Tailwind CSS Â· shadcn/ui Â· Framer Motion Â· Lucide React.

**Folder structure:**
```
/app
  /(marketing)/page.tsx           â†’ landing/hero page
  /scan/page.tsx                  â†’ scan/upload interface
  /scan/[id]/page.tsx             â†’ product analysis result page
  /history/page.tsx
  /insights/page.tsx              â†’ dashboard
/components
  /ui/                            â†’ shadcn primitives (button, input, badge, card)
  /layout/navbar.tsx
  /layout/footer.tsx
  /hero/hero-section.tsx
  /hero/scan-dropzone.tsx
  /background/gradient-blobs.tsx  â†’ reusable SVG background art component
  /cards/scan-result-card.tsx
  /cards/ingredient-warning-card.tsx
  /cards/nutrition-summary-card.tsx
  /cards/recent-scan-card.tsx
  /carousel/scan-carousel.tsx
  /badges/status-pill.tsx
/lib
  /tokens.ts                      â†’ design token constants (mirrors CSS vars for use in JS/Framer Motion)
  /animations.ts                  â†’ shared Framer Motion variants (fadeUp, cardHover, etc.)
```

**Tailwind design tokens** (`tailwind.config.ts` extend):
```ts
colors: {
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  foreground: 'var(--color-foreground)',
  'foreground-muted': 'var(--color-foreground-muted)',
  border: 'var(--color-border)',
  primary: 'var(--color-primary)',
  safe: 'var(--color-safe)',
  caution: 'var(--color-caution)',
  flag: 'var(--color-flag)',
},
borderRadius: { card: '16px', control: '10px', pill: '999px' },
boxShadow: {
  card: '0 1px 2px rgba(16,16,16,0.04), 0 8px 24px rgba(16,16,16,0.04)',
  elevated: '0 8px 30px rgba(16,16,16,0.12)',
},
fontFamily: { sans: ['var(--font-geist)'], serifItalic: ['var(--font-fraunces)'] },
```

**Component architecture principle:** one composable `Card` primitive (per Â§8) with slot props (`image`, `title`, `metaRow`, `statusRow`, `progress`) rather than five bespoke card components â€” every card type in Â§15 is a configuration of the same primitive, which keeps the whole app visually consistent by construction.

**Animation strategy:** centralize Framer Motion variants in `/lib/animations.ts` (`fadeUp`, `cardHover`, `scaleIn`) and import them everywhere rather than inlining transition objects per component â€” guarantees consistent easing/duration across the whole app, and makes a global `prefers-reduced-motion` override a one-file change.

**Responsive strategy:** mobile-first Tailwind classes throughout; define the three breakpoints from Â§13 as named Tailwind screens (`sm`/`md`/`lg` mapped to the 768/1024/1440 thresholds) so every component references the same breakpoint vocabulary as this spec.

---

## 17. FINAL DESIGN TOKEN TABLE

**COLOR TOKENS**
| Token | Value |
|---|---|
| `--color-background` | `#FAFAF7` |
| `--color-surface` | `#FFFFFF` |
| `--color-foreground` | `#16181C` |
| `--color-foreground-muted` | `#6B6E76` |
| `--color-border` | `#E9E8E3` |
| `--color-primary` | `#1B3A4B` |
| `--color-safe` | `#1F8A5B` |
| `--color-caution` | `#B8791A` |
| `--color-flag` | `#B4432E` |
| `--color-unknown` | `#8A8D94` |

**TYPOGRAPHY TOKENS**
| Token | Value |
|---|---|
| Display/heading font | Geist / Inter, weight 560 |
| Accent italic font | Fraunces / Newsreader, italic |
| Body font | Geist / Inter, weight 400 |
| H1 | `clamp(2rem, 5vw+1rem, 4.5rem)` / line-height 1.08 / letter-spacing -0.02em |
| H2 | 32â€“40px / 1.15 |
| Card title | 16â€“18px / 600 |
| Body | 16â€“18px / 1.5 |
| Eyebrow | 12â€“13px / uppercase / +0.06em tracking |
| Metadata | 13â€“14px / muted |

**SPACING TOKENS**
| Token | Value |
|---|---|
| `--space-section-y` | 96â€“128px desktop / 48â€“64px mobile |
| `--space-card-gap` | 20â€“24px |
| `--space-card-padding` | 20â€“24px |
| `--space-nav-height` | 64â€“72px |

**RADIUS TOKENS**
| Token | Value |
|---|---|
| `--radius-card` | 16â€“20px |
| `--radius-control` | 8â€“10px |
| `--radius-pill` | 999px |

**SHADOW TOKENS**
| Token | Value |
|---|---|
| `--shadow-card` | `0 1px 2px rgba(16,16,16,.04), 0 8px 24px rgba(16,16,16,.04)` |
| `--shadow-elevated` | `0 8px 30px rgba(16,16,16,.12)` |

**BREAKPOINTS**
| Name | Min-width |
|---|---|
| Mobile | 0 |
| Tablet | 768px |
| Desktop | 1440px |

**BUTTON SIZES**
| Variant | Height | Radius | Text |
|---|---|---|---|
| Primary | 40â€“44px | 8â€“10px | 14â€“15px / 500 |
| Secondary | 40â€“44px | 8â€“10px | 14â€“15px / 500 |
| Icon button | 36â€“40px | full or 8px | icon 18â€“20px |

**CARD STYLES**
| Type | Width | Radius | Padding |
|---|---|---|---|
| Scan Result Card (featured) | full/2-3 of container | 16â€“20px | 24â€“28px |
| Recent Scans card (carousel) | 280â€“320px | 12â€“16px | 16â€“20px |

---

## 18. ANTIGRAVITY IMPLEMENTATION BRIEF

*Standalone instructions â€” hand this section directly to the coding agent.*

**Build:** a Next.js + TypeScript + Tailwind + shadcn/ui + Framer Motion + Lucide React web app called **Label Reader**, a food/product label analysis tool.

**Visual language:** warm off-white background (`#FAFAF7`), near-black text (`#16181C`), a single deep ink-teal primary (`#1B3A4B`), and three semantic status colors â€” safe green (`#1F8A5B`), caution amber (`#B8791A`), flag red-terracotta (`#B4432E`). Keep the palette restrained: one accent color for interaction, semantic colors only for status pills/badges, everything else neutral. Do not introduce additional brand hues.

**Typography:** Geist or Inter for all UI, headings, and body text, weight 400 for body and 560 for headings, `letter-spacing: -0.02em` on large headings. Use Fraunces or Newsreader *italic* exclusively for 1â€“3 word emphasized fragments inside **section headlines** (not the hero H1, and never in body copy or UI chrome) â€” e.g., a section title like "See your *full breakdown.*" with only "full breakdown." in italic serif.

**Layout:** single-column narrative page structure at the top level â€” Hero â†’ Featured/highlighted scan example â†’ 4-step "How it works" â†’ Recent scans (horizontal carousel with prev/next arrow buttons) â†’ mid-page CTA banner â†’ newsletter/footer. Max content width 1200â€“1280px, centered, 24â€“32px side gutters on desktop shrinking to 16â€“20px on mobile. Section vertical padding 96â€“128px desktop, 48â€“64px mobile.

**Hero:** plain (non-italic) 2-line H1 sized via `clamp(2rem, 5vw+1rem, 4.5rem)`, an eyebrow label above it, a ~600px-capped explainer paragraph below it, then a **scan/upload dropzone styled as the primary hero element** (bordered surface, icon-left, placeholder "Drop a label photo, upload, or paste a product name") â€” this dropzone should carry the same visual weight a search bar would in a typical SaaS hero. Below that, one text link with a trailing arrow ("See how scanning works â†’"). No hero illustration or product screenshot â€” the dropzone plus background art are the entire visual interest.

**Background:** 2â€“3 overlapping blurred SVG radial-gradient blobs in low-opacity ink-teal tints, positioned behind the hero content only, `filter: blur(60-100px)`, plus an optional 3â€“5% opacity noise/grain overlay via `mix-blend-mode: overlay`. Theme-aware (must work in both light and dark mode â€” build with CSS variables, not hardcoded colors, from the start).

**Cards:** one composable `Card` primitive â€” 16â€“20px radius, 1px border in `#E9E8E3`, soft shadow (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)`), 20â€“28px padding â€” configured via props into: Scan Result Card (product photo, name, safety score bar, top flag pills), Ingredient Warning Card (severity pill + plain-language one-liner, color signaled via a left border accent *and* an icon, never color alone), Nutrition Summary Card (metric chips + mini bars), and Recent Scans Card (compact, carousel-friendly, ~280â€“320px wide).

**Buttons/controls:** primary button 40â€“44px tall, 8â€“10px radius, solid ink-teal fill, white text; secondary button same size, transparent fill, 1px border; status pills fully-rounded, tinted background at ~12% opacity of the semantic color with full-strength text; icon buttons 36â€“40px hit area, transparent, subtle background tint on hover.

**Responsive behavior:** mobile-first. Below 768px: nav collapses to logo + hamburger with a slide-out overlay menu; hero's scan dropzone becomes the first full-width element below the nav; carousels show one card with a partial peek of the next; all cards go full-width and stack vertically; section padding compresses to 48â€“64px. Between 768â€“1439px: two-card carousels, 2Ã—2 "how it works" grid. At 1440px+: full desktop layout as described above.

**Animations:** card hover = `translateY(-2px)` + slightly deeper shadow, 150â€“200ms ease-out. Status pills fade+scale in (0.95â†’1) on result load, 200ms. Sections fade/slide up on scroll-into-view (`opacity 0â†’1`, `translateY 16pxâ†’0`, 400ms ease-out, `viewport once`). Sticky nav gains a backdrop blur + hairline border once scrolled past ~40px. Wrap every animation in a `prefers-reduced-motion` check with an instant-appear fallback. Keep background blobs either fully static or animated with an extremely slow (20â€“40s), barely-perceptible drift â€” this product communicates food safety and should feel calm, not busy.

**Explicitly do NOT do:**
- Do not reuse Canopy's actual name, logo, wordmark, or literal copy/headlines.
- Do not copy Canopy's specific green/forest color values â€” Label Reader's primary is the deep ink-teal specified above.
- Do not implement a literal "crowdfunding/pledge" mechanic â€” that's Canopy's business model, not Label Reader's. Adapt the *progress bar visual pattern* to an "Ingredient Safety Score," not to funding progress.
- Do not use alarm-red or aggressive/flashing treatment for flagged ingredients â€” match the source site's measured, non-fearmongering tone; the flag color is a muted red-terracotta, not a saturated warning red, and every warning pairs color with text and an icon.
- Do not add a hero product illustration or stock photography â€” the scan dropzone and background art are the entire hero visual, per the reference site's search-bar-as-hero-visual pattern.
