import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Content-Security-Policy.
 *
 * `unsafe-inline` / `unsafe-eval` on script-src are unavoidable without moving
 * Next's hydration payload onto a nonce, which needs every response to be
 * dynamic. The policy still earns its place: it pins scripts, connections and
 * frames to known origins, so an injected `<script src>` or a beacon to an
 * attacker's host is blocked even though inline script is not.
 *
 * Origins in use: Vercel Analytics (script + beacon), Pusher (websocket +
 * REST fallback), Google Fonts (next/font self-hosts the files but the CSS is
 * fetched at build time), and `data:` for the base64 lead sounds and avatars.
 */
function buildCsp(isDev: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://va.vercel-scripts.com",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Function form, because `process.env.NODE_ENV` is not reliably set when this
 * file is evaluated — `next start` was serving the dev CSP (with `unsafe-eval`)
 * in production. `phase` is what Next actually guarantees.
 */
const nextConfig = (phase: string): NextConfig => ({
  // Do not advertise the framework to anyone fingerprinting the app.
  poweredByHeader: false,

  // The /busniess segment was renamed to /business. Keep the old paths working
  // so existing links and bookmarks do not dead-end on a 404.
  async redirects() {
    return [
      { source: "/busniess", destination: "/business", permanent: true },
      { source: "/busniess/:path*", destination: "/business/:path*", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp(phase === PHASE_DEVELOPMENT_SERVER) },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Only meaningful over HTTPS; browsers ignore it on plain http.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Nothing under /api should ever be cached by a proxy or the browser —
        // several of these responses are per-user.
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
});

export default nextConfig;
