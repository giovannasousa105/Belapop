import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import "@/styles/globals.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { getAcsbConfig, initGuarded } from "@/lib/accessibilityWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata: Metadata = {
  title: "BelaPop | Curadoria de beleza e autocuidado",
  description:
    "Mini-marketplace editorial de beleza, autocuidado e bem-estar."
};

const acsbConfig = getAcsbConfig();
const acsbInitScript = `(${initGuarded.toString()})(${JSON.stringify(acsbConfig)});`;

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans text-blush-50`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Script
          id="acsb-script"
          src="https://acsbapp.com/apps/app/dist/js/app.js"
          strategy="afterInteractive"
        />
        <Script id="acsb-init" strategy="afterInteractive">
          {`(function(){${acsbInitScript}})();`}
        </Script>
      </body>
    </html>
  );
}
