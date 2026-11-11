import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.openfoodfacts.org", pathname: "/images/products/**" },
    ],
    maximumRedirects: 0,
  },
};

export default nextConfig;
