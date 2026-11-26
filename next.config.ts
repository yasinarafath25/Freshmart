import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; nonces would require middleware, which OpenNext Cloudflare doesn't support for Next 16 proxy.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    ];
  },
};

export default nextConfig;

// Makes Cloudflare bindings available to `next dev` when a wrangler config is present.
// Guarded so a plain `next dev` without wrangler still works.
if (process.env.NODE_ENV === "development" && process.env.CF_DEV_BINDINGS === "1") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
