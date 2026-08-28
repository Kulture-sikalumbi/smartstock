import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ohqkkovjqdcewyuutgpb.supabase.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  // The service worker file itself must never be cached by the browser or
  // Azure's CDN/static hosting layer -- otherwise clients keep running an
  // old sw.js forever and never discover new deployments, serving stale
  // cached content indefinitely.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
