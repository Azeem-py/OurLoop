import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "lucide-react",
    "framer-motion",
    "date-fns",
    "canvas-confetti",
    "browser-image-compression",
  ],
};

export default nextConfig;
