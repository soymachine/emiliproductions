import type { NextConfig } from "next";

// Exportación estática: se sirve gratis desde Firebase Hosting (plan Spark), sin servidor.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
