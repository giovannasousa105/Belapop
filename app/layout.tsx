import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Inter,
  Manrope,
} from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";

import "@/styles/globals.css";
import "@/styles/theme.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { VercelInsightsConsent } from "@/components/analytics/VercelInsightsConsent";
import { getAcsbConfig, initGuarded } from "@/lib/accessibilityWidget";
import { getPublicUrl, sanitizePublicEnvValue } from "@/lib/publicEnv";

// DM Sans — sans principal do design system (peso 300/400/500)
const dmSans = DM_Sans({
  subsets:  ["latin"],
  weight:   ["300", "400", "500"],
  variable: "--font-sans",
  display:  "swap",
});

// DM Serif Display — serif editorial (peso 400, nunca bold)
const dmSerifDisplay = DM_Serif_Display({
  subsets:  ["latin"],
  weight:   ["400"],
  variable: "--font-serif",
  display:  "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap"
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  display: "swap"
});
// Mont Serif — fonte de destaque principal (font-headline / var(--font-playfair))
// Arquivos em /public/fonts/ — substituir por Mont Serif real (Fontfabric) quando licenciado.
// Placeholder atual: Fraunces (SIL OFL) com DNA visual similar.
const montSerif = localFont({
  variable: "--font-playfair",
  display: "swap",
  src: [
    { path: "../public/fonts/MontSerif-Light.woff2",    weight: "300", style: "normal" },
    { path: "../public/fonts/MontSerif-Regular.woff2",  weight: "400", style: "normal" },
    { path: "../public/fonts/MontSerif-Italic.woff2",   weight: "400", style: "italic" },
    { path: "../public/fonts/MontSerif-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/MontSerif-Bold.woff2",     weight: "700", style: "normal" },
  ],
});
const metadataBaseUrl = getPublicUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://belapopoficial.com.br"
);

// Sem maximum-scale — permite zoom de acessibilidade
export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#FAF8F5",   // off-white BelaPop — barra do browser no mobile
};

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),

  manifest: "/manifest.json",

  title: {
    default:  "BelaPop — Skincare Curado com inteligência",
    template: "%s · BelaPop",
  },

  description:
    "Skincare com curadoria clínica, análise facial personalizada e lotes " +
    "limitados verificados. Descubra sua rotina ideal em minutos.",

  keywords: [
    "skincare", "cuidados com a pele", "rotina skincare",
    "niacinamida", "vitamina c sérum", "hidratante facial",
    "análise de pele", "skin scan", "curadoria beauty",
    "lote limitado", "sérum", "protetor solar",
  ],

  authors:   [{ name: "BelaPop", url: metadataBaseUrl }],
  creator:   "BelaPop",
  publisher: "BelaPop",

  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },

  openGraph: {
    type:        "website",
    locale:      "pt_BR",
    url:         metadataBaseUrl,
    siteName:    "BelaPop",
    title:       "BelaPop — Skincare Curado com inteligência",
    description: "Curadoria clínica, análise facial e lotes limitados verificados.",
    images: [{
      url:    "/og-default.jpg",
      width:  1200,
      height: 630,
      alt:    "BelaPop — Skincare com inteligência",
    }],
  },

  twitter: {
    card:        "summary_large_image",
    site:        "@belapop",
    creator:     "@belapop",
    title:       "BelaPop — Skincare Curado com inteligência",
    description: "Curadoria clínica, análise facial e lotes limitados verificados.",
    images:      ["/og-default.jpg"],
  },

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:  true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },

  other: {
    "format-detection": "telephone=no",
  },
};

const acsbConfig = getAcsbConfig();
const acsbInitScript = `(${initGuarded.toString()})(${JSON.stringify(acsbConfig)});`;
const acsbAccountId =
  sanitizePublicEnvValue(
    process.env.NEXT_PUBLIC_ACCESSIBILITY_ACCOUNT_ID ||
      process.env.NEXT_PUBLIC_ACCESSIBE_ACCOUNT_ID ||
      ""
  );

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="image"
          href="/editorial/belapop-skin-scan-hero-mobile-poster.jpg"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          as="image"
          href="/editorial/belapop-skin-scan-hero-poster.jpg"
          media="(min-width: 768px)"
        />
      </head>
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} ${manrope.variable} ${inter.variable} ${cormorant.variable} ${montSerif.variable} font-sans text-bpOffWhite`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg"
        >
          Pular para o conteúdo principal
        </a>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <AnalyticsScripts />
        <VercelInsightsConsent />
        {acsbAccountId ? (
          <>
            <Script
              id="acsb-script"
              src="https://acsbapp.com/apps/app/dist/js/app.js"
              strategy="afterInteractive"
              data-account={acsbAccountId}
            />
            <Script id="acsb-init" strategy="afterInteractive">
              {`(function(){${acsbInitScript}})();`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
