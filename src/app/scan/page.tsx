import { ScanDropzone } from "@/components/hero/scan-dropzone";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan a Label",
};

export default function ScanPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-5 py-24 md:py-32">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Scan or Search
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Search for an existing product to view its analysis.
        </p>
      </div>
      
      <ScanDropzone />
    </div>
  );
}
