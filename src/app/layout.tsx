import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

/**
 * Inter — primary sans-serif for all UI, headings, and body copy.
 * Variable font: supports weights 100–900 without additional requests.
 * Exposed as CSS variable --font-inter so globals.css can reference it.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // prevents invisible text during font load
});

/**
 * Fraunces — accent italic serif.
 * Used exclusively for 1–3 word emphasis fragments inside section headlines.
 * Per design spec §3/§6: NEVER in the hero H1, body copy, or UI chrome.
 *
 * Weight 400 italic is the only style needed; using a subset keeps the
 * downloaded font file small.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["italic"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Label Reader — Know What You're Eating",
    template: "%s | Label Reader",
  },
  description:
    "Understand what's inside your packaged food. Label Reader decodes ingredient lists, nutrition facts, and marketing claims for Indian consumers.",
  keywords: ["food label", "ingredients", "nutrition", "India", "food safety"],
  authors: [{ name: "Label Reader" }],
  creator: "Label Reader",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Label Reader",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      {/*
       * suppressHydrationWarning on html prevents React from warning when a
       * browser extension modifies attributes (e.g. dark-mode injectors).
       * This is the conventional Next.js pattern; it doesn't suppress real errors.
       */}
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
