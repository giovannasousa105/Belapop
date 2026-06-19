"use client";

import Link from "next/link";

import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";
import { belapopCompany, belapopOperationalContacts } from "@/lib/legal/content";

// ── Ícones SVG inline ─────────────────────────────────────────────────────────

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTiktok() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.79 1.54V6.79a4.85 4.85 0 0 1-1.02-.1z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ── Dados ────────────────────────────────────────────────────────────────────

const institucionalLinks = [
  { label: "Sobre a BelaPop", href: "/sobre" },
  { label: "Círculo BelaPop", href: "/circulo" },
  { label: "Segurança", href: "/seguranca" },
  { label: "Fale conosco", href: "/contato" },
];

const legalLinks = [
  { label: "Aviso de Privacidade", href: "/aviso-de-privacidade" },
  { label: "Termos de Uso", href: "/termos-de-uso" },
  { label: "Política de Cookies", href: "/política-de-cookies" },
  { label: "Trocas e Devoluções", href: "/política-de-trocas-e-devoluções" },
  { label: "Envio e Frete", href: "/política-de-envio" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/belapop.oficial",
    Icon: IconInstagram,
  },
  {
    label: "TikTok",
    href: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://tiktok.com/@belapop.oficial",
    Icon: IconTiktok,
  },
  {
    label: "Facebook",
    href: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/belapopoficial",
    Icon: IconFacebook,
  },
];

const lgpdFields = [
  { label: "Razão Social", value: belapopCompany.legalName },
  { label: "CNPJ", value: belapopCompany.cnpj },
  { label: "Endereço", value: belapopCompany.address },
  { label: "E-mail", value: belapopOperationalContacts.institutionalEmail },
  { label: "Privacidade", value: belapopOperationalContacts.privacyChannel },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function BelaPopValidatedFooter() {
  return (
    <footer className="bg-[#0e0e0e] text-white">

      {/* ── Banner CTA Círculo ─────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#c4848f]">
                Círculo BelaPop
              </p>
              <p className="mt-1 font-headline text-lg font-semibold tracking-tight text-white sm:text-xl">
                Acesso antecipado a cada drop.
              </p>
            </div>
            <Link
              href="/circulo"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c4848f]/40 bg-[#c4848f]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#e8a8b0] transition-colors hover:border-[#c4848f]/60 hover:bg-[#c4848f]/20"
            >
              Quero entrar no Círculo
            </Link>
          </div>
        </div>
      </div>

      {/* ── Corpo principal ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]">

          {/* Coluna 1: Marca + LGPD */}
          <div className="space-y-7">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c4848f]/20">
                <span className="h-3 w-3 rounded-full bg-[#c4848f]" />
              </span>
              <span className="font-headline text-xl font-bold tracking-tight text-white">
                BelaPop
              </span>
            </div>

            {/* Tagline */}
            <p className="max-w-[280px] text-[13px] leading-relaxed text-white/40">
              Curadoria de skincare coreano com seller identificado, pagamento seguro e pós-venda humano.
            </p>

            {/* Card LGPD compacto */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c4848f]/80">
                Identificação BelaPop
              </p>
              <dl className="mt-4 space-y-2.5">
                {lgpdFields.map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-[88px_1fr] gap-x-2">
                    <dt className="pt-0.5 text-[10px] uppercase tracking-[0.10em] text-white/30">
                      {label}
                    </dt>
                    <dd className="text-[11px] leading-5 text-white/60 break-words">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-white/[0.07] pt-3 text-[10px] leading-5 text-white/30">
                Seller parceiro identificado antes da conclusão da compra.
              </p>
            </div>
          </div>

          {/* Colunas 2 + 3: Nav em 2 colunas no mobile */}
          <div className="grid grid-cols-2 gap-8 lg:contents">

            {/* Coluna 2: Institucional */}
            <div className="space-y-5">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                Institucional
              </h5>
              <ul className="space-y-3">
                {institucionalLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/45 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna 3: Legal */}
            <div className="space-y-5">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                Legal
              </h5>
              <ul className="space-y-3">
                {legalLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/45 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookiePreferencesButton
                    label="Personalizar cookies"
                    className="text-[13px] text-white/45 transition-colors hover:text-white"
                  />
                </li>
              </ul>
            </div>
          </div>

          {/* Coluna 4: Redes sociais */}
          <div className="space-y-5">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              Siga a BelaPop
            </h5>

            {/* Ícones em linha no mobile, coluna no desktop */}
            <div className="flex flex-row flex-wrap gap-3 lg:flex-col lg:gap-3.5">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex items-center gap-3 text-white/45 transition-colors hover:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition-colors group-hover:border-[#c4848f]/40 group-hover:bg-[#c4848f]/10 group-hover:text-[#e8a8b0]">
                    <Icon />
                  </span>
                  <span className="hidden text-[13px] lg:block">{label}</span>
                </a>
              ))}
            </div>

            {/* Selos */}
            <div className="mt-2 flex flex-wrap gap-2">
              {["Compra Segura", "SSL", "LGPD"].map((selo) => (
                <span
                  key={selo}
                  className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.10em] text-white/25"
                >
                  {selo}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Copyright ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-relaxed text-white/20">
              © 2026 BelaPop. Dados operacionais e políticas podem ser atualizados conforme validação jurídica e operacional.
            </p>
            <p className="text-[11px] text-white/15">
              Feito com cuidado no Brasil
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
}
