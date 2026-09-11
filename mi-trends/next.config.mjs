/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    /*
     * Source imagery tops out around 2000px wide, so generating the default
     * 3840px variant upscales for no benefit — and in dev that single
     * optimization is slow enough to leave the hero blank while it runs.
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 2048],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Seed imagery.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage for admin-uploaded media.
      ...(supabaseHost
        ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
  experimental: {
    // Keeps first-load JS down by tree-shaking these barrel imports.
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

export default nextConfig;
