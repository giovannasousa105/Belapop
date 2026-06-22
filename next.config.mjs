import { withSentryConfig } from "@sentry/nextjs";

const parseHostname = (value) => {
  if (!value) return null;
  try {
    return new URL(value.trim()).hostname;
  } catch {
    return null;
  }
};

const allowedImageHosts = [
  parseHostname(process.env.NEXT_PUBLIC_SUPABASE_URL),
  "zvlxxtdkjjcjaxbsphhh.supabase.co",
  "vbtxdkytnbydsdzmdget.supabase.co",
  "cdn.belapop.com",
  "secure.cdn.belapop.com",
  "lh3.googleusercontent.com",
  "localhost",
  "127.0.0.1"
].filter(Boolean);

const uniqueHosts = [...new Set(allowedImageHosts)];
const isDev = process.env.NODE_ENV !== "production";

const buildContentSecurityPolicy = () => {
  const directives = [
    ["default-src", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'"]],
    ["img-src", ["'self'", "data:", "blob:", "https:"]],
    ["font-src", ["'self'", "data:", "https:"]],
    ["style-src", ["'self'", "'unsafe-inline'", "https:"]],
    [
      "script-src",
      [
        "'self'",
        "'unsafe-inline'",
        "'wasm-unsafe-eval'",
        ...(isDev ? ["'unsafe-eval'"] : ["'unsafe-eval'"]),
        "https:"
      ]
    ],
    [
      "connect-src",
      ["'self'", "https:", "wss:", ...(isDev ? ["http:", "ws:"] : [])]
    ],
    ["frame-src", ["'self'", "https:"]],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    ...(isDev ? [] : [["upgrade-insecure-requests", []]])
  ];

  return directives
    .map(([directive, values]) =>
      values.length > 0 ? `${directive} ${values.join(" ")}` : directive
    )
    .join("; ");
};

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy()
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()"
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/skin-scan/relatorio/route": ["./lib/skin-scan/fonts/**"]
  },
  images: {
    formats:          ["image/avif", "image/webp"],
    deviceSizes:      [360, 480, 640, 828, 1080, 1200, 1920],
    imageSizes:       [120, 256, 384, 600],
    minimumCacheTTL:  31536000,
    remotePatterns: uniqueHosts.map((hostname) => ({
      protocol: hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https",
      hostname
    }))
  },
  async redirects() {
    return [
      { source: "/produtos",         destination: "/catalogo",       permanent: true },
      { source: "/loja",             destination: "/catalogo",       permanent: true },
      { source: "/collections/all",  destination: "/catalogo",       permanent: true },
      { source: "/shop",             destination: "/catalogo",       permanent: true },
      { source: "/envio-frete",      destination: "/envio-e-frete",  permanent: true },
      { source: "/frete",            destination: "/envio-e-frete",  permanent: true },
      // /círculo (com acento) → /circulo (URL canônica sem acento)
      { source: "/c%C3%ADrculo",     destination: "/circulo",        permanent: true },
      { source: "/c%C3%ADrculo/:path*", destination: "/circulo/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN
  },
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true
    }
  }
});
