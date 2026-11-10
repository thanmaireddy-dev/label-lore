import Link from "next/link";
import { RecentProducts } from "@/components/sections/recent-products";

export const metadata = { title: "Recent products | Label Reader" };

export default function HistoryPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-5 pt-28 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">Your browser</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Recent products</h1>
          <p className="mt-2 text-sm text-foreground-muted">Reopen product analyses you viewed recently.</p>
        </div>
        <Link href="/scan" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Search or scan a label</Link>
      </div>
      <RecentProducts title="Recently viewed" emptyMessage="No recent products yet. Search for a product or open a barcode result to get started." />
    </main>
  );
}
