import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import "@/styles/globals.css";
import "@/styles/theme.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { getAcsbConfig, initGuarded } from "@/lib/accessibilityWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata: Metadata = {
  title: "BelaPop | Curadoria editorial de beleza",
  description:
    "Curadoria, editorial e beleza premium para rituais de autocuidado com presença."
};

const acsbConfig = getAcsbConfig();
const acsbInitScript = `(${initGuarded.toString()})(${JSON.stringify(acsbConfig)});`;
const acsbAccountId =
  process.env.NEXT_PUBLIC_ACCESSIBILITY_ACCOUNT_ID ||
  process.env.NEXT_PUBLIC_ACCESSIBE_ACCOUNT_ID ||
  "";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans text-bpOffWhite`}
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
