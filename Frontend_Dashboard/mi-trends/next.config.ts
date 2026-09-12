import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  // The admin panel is a separate Vite app on port 5173. Proxying it under
  // /admin means there is one address to open in dev — localhost:3000 — even
  // though two dev servers are still running behind it.
  async rewrites() {
    return [
      { source: "/admin", destination: "http://localhost:5173/admin/" },
      { source: "/admin/:path*", destination: "http://localhost:5173/admin/:path*" },
    ];
  },
};

export default nextConfig;
