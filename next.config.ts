import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge would otherwise land in every visual regression screenshot.
  devIndicators: false,
};

export default nextConfig;
