"use client";

import Link from "next/link";

import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";
import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { footerLinkGroups } from "@/lib/legal/content";

const socialLinks = [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/belapop.oficial" },
  { label: "TikTok", href: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://tiktok.com/@belapop.oficial" },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/belapopoficial" }
] as const;

type FooterLinkItem = (typeof footerLinkGroups)[number]["links"][number];

function FooterLink({
  item
}: {
  item: FooterLinkItem;
}) {
  if (!("href" in item)) {
    return (
      <CookiePreferencesButton
        label={item.label}
        className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white hover:underline underline-offset-4"
      />
    );
  }

  return (
    <Link
      href={item.href}
      className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white hover:underline underline-offset-4"
    >
      {item.label}
    </Link>
  );
}

export function BelaPopValidatedFooter() {
  return (
    <footer className="bg-black px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <div className="font-headline text-lg font-bold">BelaPop</div>
          <p className="max-w-xs font-body text-[10px] uppercase tracking-[0.18em] leading-relaxed text-gray-400">
            Curadoria premium, seller identificado, pagamento sujeito a validacao e pos-venda com
            informacao clara.
          </p>
          <InstitutionalIdentityCard tone="dark" compact className="max-w-xl" />
        </div>

        {footerLinkGroups.map((column) => (
          <div key={column.title} className="space-y-6">
            <h5 className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              {column.title}
            </h5>
            <ul className="space-y-4">
              {column.links.map((item) => (
                <li key={item.label}>
                  <FooterLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-6">
          <h5 className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Presenca digital
          </h5>
          <div className="flex flex-col gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs leading-6 text-gray-400">
            A BelaPop informa o seller responsavel antes da compra. Marcas exibidas nao se tornam
            vendedoras automaticamente.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl border-t border-white/5 pt-10">
        <p className="text-center font-body text-[10px] uppercase tracking-[0.18em] text-gray-400 md:text-left">
          &copy; 2026 BelaPop. Dados operacionais e politicas podem ser atualizados conforme
          validacao juridica e operacional.
        </p>
      </div>
    </footer>
  );
}
