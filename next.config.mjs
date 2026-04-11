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
      ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), "https:"]
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
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: uniqueHosts.map((hostname) => ({
      protocol: hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https",
      hostname
    }))
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

export default nextConfig;
