/** @type {import('next').NextConfig} */
let nextConfig = {
  serverExternalPackages: ["mongoose"],
  // Next.js auto-adds a pre-middleware 308 redirect that strips trailing
  // slashes, which breaks WebDAV collection paths like /webdav/. We disable
  // it and normalize trailing slashes in proxy.ts instead (WebDAV paths keep
  // theirs, everything else gets rewritten to the canonical no-slash form).
  skipTrailingSlashRedirect: true,
  // Persist the Turbopack dev cache across restarts (SST/RocksDB). Speeds up
  // cold `next dev` starts by reusing compiled output. We previously kept it
  // off because of "Unable to write SST file" lockups on Windows/WSL paths,
  // but with a clean .next and newer Next it is stable here — if it starts
  // erroring again, set `turbopackFileSystemCacheForDev: false`.
  experimental: {
    turbopackFileSystemCacheForDev: true,
    // Without this, dev's proxy.ts rewrite buffers the request body and
    // silently drops everything past ~10MiB — WebDAV PUTs > 10MiB via the
    // /webdav mount ended up truncated (verified: direct /api/webdav was
    // fine, proxied /webdav was 30MiB -> 10.4MiB). Cap at 256MiB so big
    // uploads stream through the rewrite intact.
    proxyClientMaxBodySize: 256 * 1024 * 1024,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.telegram.org",
      },
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        source: "/s/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/logo.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
};

if (process.env.ANALYZE === "true") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  nextConfig = withBundleAnalyzer(nextConfig);
}

module.exports = nextConfig;
