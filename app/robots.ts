import type { MetadataRoute } from "next";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br")
    .trim()
    .replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/seller/portal/",
          "/seller/cadastro/",
          "/configurações/",
          "/perfil/",
          "/minha-pele/",
          "/checkout/",
          "/conta/",
          "/parceiro/",
        ],
      },
      {
        // Bloquear scrapers de AI
        userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "Claude-Web"],
        disallow:  "/",
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
