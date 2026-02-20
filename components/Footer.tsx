"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function MarqueeText({
  text,
  speed = 0.4,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    let x = 0;

    const step = () => {
      x += speed;
      const width = el.scrollWidth / 2; // conteúdo duplicado
      if (x >= width) x = 0;
      el.style.transform = `translateX(${-x}px)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={trackRef} className="flex w-max items-center gap-10 will-change-transform whitespace-nowrap">
        <span className="tracking-wide">{text}</span>
        <span className="tracking-wide">{text}</span>
      </div>
    </div>
  );
}

export const Footer = () => {
  const pathname = usePathname();
  const retailRoutes = new Set([
    "/",
    "/catalogo",
    "/sobre",
    "/seguranca",
    "/privacidade",
    "/cookies",
    "/termos",
    "/carreiras"
  ]);
  const isRetail = retailRoutes.has(pathname) || pathname.startsWith("/produto/");

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "";
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "";
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || "/logo.svg";
  const logoDarkUrl = process.env.NEXT_PUBLIC_LOGO_DARK_URL || "/logo-dark.svg";
  const footerLogoUrl = isRetail ? logoDarkUrl : logoUrl;

  const linkClass = isRetail
    ? "text-bpGraphite hover:text-bpPink font-semibold"
    : "text-bpPinkSoft/80 hover:text-bpOffWhite font-semibold";
  const iconClass = isRetail ? "text-bpBlackSoft hover:text-bpPink" : "text-white/80 hover:text-white";

  return (
    <footer
      className={`border-t pt-12 pb-20 md:pb-12 ${
        isRetail ? "border-black/10 bg-white text-bpGraphite" : "border-white/10 bg-bpBlack text-bpPinkSoft/80"
      }`}
    >
      {/* Faixa superior rosa com marca */}
      <div className="w-full bg-[#B80F5A] px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="BelaPop"
                className="h-10 w-auto rounded bg-white/10 p-1 md:h-11"
                loading="lazy"
              />
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">B.</span>
            )}
            <span>BelaPop Oficial</span>
          </div>
          <span className="text-[11px] font-medium tracking-[0.2em] sm:text-[12px]">
            Curadoria • Concierge • Luxo
          </span>
        </div>
      </div>

      {/* Marquee entre a barra rosa e o restante do footer */}
      <div className="bg-bpBlack text-white border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 py-3">
          <MarqueeText
            text="Curadoria humana. Logística aveludada. Rituais que fluem."
            speed={0.65}
            className="text-sm md:text-base"
          />
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-10 px-6">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Coluna institucional BelaPop */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bpPink font-semibold">BelaPop</p>
            <h3 className="font-display text-xl font-bold text-bpBlack md:text-bpBlackSoft dark:text-bpOffWhite">
              Beleza editorial, concierge e curadoria premium.
            </h3>
          </div>

          {/* Institucional */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] font-semibold">Institucional</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/sobre" className={linkClass}>
                Sobre a BelaPop
              </Link>
              <Link href="/seguranca" className={linkClass}>
                Segurança
              </Link>
              <Link href="/privacidade" className={linkClass}>
                Aviso de Privacidade
              </Link>
              <Link href="/cookies" className={linkClass}>
                Politica de Cookies
              </Link>
              <Link href="/termos" className={linkClass}>
                Termos e Condições Gerais
              </Link>
              <Link href="/carreiras" className={linkClass}>
                Trabalhe Conosco
              </Link>
              <Link href="/faq" className={linkClass}>
                Perguntas Frequentes
              </Link>
            </div>
          </div>

          {/* Suporte */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] font-semibold">Suporte</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/contato" className={linkClass}>
                Concierge
              </Link>
              <div className="pt-3 text-bpBlackSoft dark:text-bpPinkSoft/80 text-xs leading-relaxed md:text-bpGraphite/70 md:dark:text-bpPinkSoft/70">
                <p className="font-semibold text-bpBlackSoft dark:text-bpOffWhite">Horários do concierge</p>
                <p>Seg à Sex: 8h às 20h</p>
                <p>Sáb: 9h às 20h</p>
                <p className="text-bpGraphite dark:text-bpPinkSoft/70 md:text-bpGraphite/60 md:dark:text-bpPinkSoft/60">
                  Indisponível em domingos e feriados nacionais
                </p>
              </div>
            </div>
          </div>

          {/* Siga */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] font-semibold">Siga</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {instagramUrl ? (
                <Link href={instagramUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <span className="sr-only">Instagram</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h9a4.5 4.5 0 0 1 4.5 4.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0zM17.25 6.75h.008v.008h-.008z" />
                  </svg>
                </Link>
              ) : null}
              {tiktokUrl ? (
                <Link href={tiktokUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="TikTok">
                  <span className="sr-only">TikTok</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 8.17c-1.43-.08-2.84-.52-4.05-1.31V15a4.5 4.5 0 1 1-4.5-4.5c.07 0 .14 0 .21.01V8.02A8.98 8.98 0 0 0 10.5 8a7.5 7.5 0 1 0 7.5 7.5V9.28A8.06 8.06 0 0 0 21 10V8.17Z" />
                  </svg>
                </Link>
              ) : null}
              {facebookUrl ? (
                <Link href={facebookUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <span className="sr-only">Facebook</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10h2.5l.5-3H13V5.5c0-.87.28-1.5 1.63-1.5H16V1.14C15.27 1.05 14.04.99 12.64.99 9.93.99 8 2.65 8 5.18V7H5.5v3H8v8h5v-8Z" />
                  </svg>
                </Link>
              ) : null}
              {youtubeUrl ? (
                <Link href={youtubeUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="YouTube">
                  <span className="sr-only">YouTube</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.6 7.2s-.2-1.44-.8-2.08c-.76-.8-1.6-.8-1.98-.84C16.4 4 12 4 12 4h-.02s-4.4 0-6.8.28c-.38.04-1.22.04-1.98.84C2.6 5.76 2.4 7.2 2.4 7.2S2.2 8.88 2.2 10.56v1.84c0 1.68.2 3.36.2 3.36s.2 1.44.8 2.08c.76.8 1.76.76 2.2.84 1.6.16 6.6.28 6.6.28s4.4 0 6.8-.28c.38-.04 1.22-.04 1.98-.84.6-.64.8-2.08.8-2.08s.2-1.68.2-3.36v-1.84c0-1.68-.2-3.36-.2-3.36ZM9.76 13.96V8.8l5.2 2.6-5.2 2.56Z" />
                  </svg>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Pagamentos / segurança */}
        <div className="mt-6 rounded-2xl border border-pink-500/20 bg-bpBlack text-white px-6 py-5 shadow-[0_10px_40px_rgba(184,15,90,0.08)]">
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70 font-semibold">Formas de pagamento</p>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { name: "Mastercard", logo: "/payments/mastercard.svg" },
                { name: "Visa", logo: "/payments/visa.svg" },
                { name: "Amex", logo: "/payments/amex.svg" },
                { name: "Elo", logo: "/payments/elo.svg" },
                { name: "Pix", logo: "/payments/pix.svg" }
              ].map((brand) => (
                <span
                  key={brand.name}
                  className="inline-flex items-center justify-center rounded-xl bg-black/40 px-3 py-2 text-xs font-semibold tracking-wide shadow-sm"
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-7 w-auto md:h-8"
                    loading="lazy"
                  />
                </span>
              ))}
            </div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70 font-semibold">Segurança</p>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-pink-500/40 bg-white/5 px-4 py-2 text-xs font-semibold text-white">
                Site seguro • SSL
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t pt-6 text-xs md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            {footerLogoUrl ? (
              <img
                src={footerLogoUrl}
                alt="BelaPop"
                className="h-12 w-auto object-contain md:h-10"
                loading="lazy"
              />
            ) : (
              <span className="font-semibold tracking-[0.3em] text-bpBlackSoft dark:text-bpOffWhite">BelaPop</span>
            )}
            <span className="font-semibold">© 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em]">
            <Link href="/catalogo" className="rounded-full bg-bpBlackSoft px-4 py-2 text-bpOffWhite shadow md:bg-bpBlack">
              Comprar agora
            </Link>
            <Link
              href="/contato"
              className="hidden rounded-full border border-bpPink px-4 py-2 text-bpPink hover:bg-bpPinkSoft/20 md:inline-flex"
            >
              Falar com concierge
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
