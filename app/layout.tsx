import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Manrope, Playfair_Display } from "next/font/google";
import Script from "next/script";

import "@/styles/globals.css";
import "@/styles/theme.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { getAcsbConfig, initGuarded } from "@/lib/accessibilityWidget";
import { getPublicUrl, sanitizePublicEnvValue } from "@/lib/publicEnv";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"]
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"]
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"]
});
const metadataBaseUrl = getPublicUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://belapopoficial.com.br"
);

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: "BelaPop | Curadoria editorial de beleza",
  description: "Curadoria, editorial e beleza premium para rituais de autocuidado com presenca.",
  openGraph: {
    title: "BelaPop | Curadoria editorial de beleza",
    description: "Curadoria, editorial e beleza premium para rituais de autocuidado com presenca.",
    images: [{ url: "/editorial/ritual-noturno.svg", alt: "BelaPop editorial" }],
    type: "website"
  }
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
      <body
        className={`${manrope.variable} ${inter.variable} ${cormorant.variable} ${playfair.variable} font-sans text-bpOffWhite`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
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

