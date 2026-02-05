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
    "/termos"
  ]);
  const isRetail = retailRoutes.has(pathname) || pathname.startsWith("/produto/");

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com";
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL || "https://www.tiktok.com";
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || "";

  const linkClass = isRetail
    ? "text-noir-700 hover:text-luxe-600 font-semibold"
    : "text-blush-100/80 hover:text-blush-50 font-semibold";
  const iconClass = isRetail ? "text-noir-800 hover:text-luxe-600" : "text-white/80 hover:text-white";

  return (
    <footer
      className={`border-t py-12 ${
        isRetail ? "border-black/10 bg-white text-noir-700" : "border-white/10 bg-noir-950 text-blush-100/80"
      }`}
    >
      {/* Faixa superior rosa com marca */}
      <div className="w-full bg-[#B80F5A] px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt="BelaPop" width={32} height={32} className="h-8 w-auto rounded bg-white/10 p-1" />
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">B.</span>
            )}
            <span>BelaPop Oficial</span>
          </div>
          <span className="text-[12px] font-medium tracking-[0.2em]">Curadoria • Concierge • Luxo</span>
        </div>
      </div>

      {/* Marquee entre a barra rosa e o restante do footer */}
      <div className="bg-noir-950 text-white border-b border-white/10">
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
            <p className="text-[10px] uppercase tracking-[0.35em] text-luxe-600 font-semibold">BelaPop</p>
            <h3 className="font-display text-xl font-bold text-noir-900 dark:text-blush-50">
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
              <div className="pt-3 text-noir-500 dark:text-blush-100/70 text-xs leading-relaxed">
                <p className="font-semibold text-noir-800 dark:text-blush-50">Horários do concierge</p>
                <p>Seg à Sex: 8h às 20h</p>
                <p>Sáb: 9h às 20h</p>
                <p className="text-noir-400 dark:text-blush-100/60">Indisponível em domingos e feriados nacionais</p>
              </div>
            </div>
          </div>

          {/* Siga */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] font-semibold">Siga</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href={instagramUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="Instagram">
                <span className="sr-only">Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h9a4.5 4.5 0 0 1 4.5 4.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0zM17.25 6.75h.008v.008h-.008z" />
                </svg>
              </Link>
              <Link href={tiktokUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="TikTok">
                <span className="sr-only">TikTok</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 8.17c-1.43-.08-2.84-.52-4.05-1.31V15a4.5 4.5 0 1 1-4.5-4.5c.07 0 .14 0 .21.01V8.02A8.98 8.98 0 0 0 10.5 8a7.5 7.5 0 1 0 7.5 7.5V9.28A8.06 8.06 0 0 0 21 10V8.17Z" />
                </svg>
              </Link>
              <Link href={facebookUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="Facebook">
                <span className="sr-only">Facebook</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10h2.5l.5-3H13V5.5c0-.87.28-1.5 1.63-1.5H16V1.14C15.27 1.05 14.04.99 12.64.99 9.93.99 8 2.65 8 5.18V7H5.5v3H8v8h5v-8Z" />
                </svg>
              </Link>
              <Link href={youtubeUrl} className={iconClass} target="_blank" rel="noreferrer" aria-label="YouTube">
                <span className="sr-only">YouTube</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.6 7.2s-.2-1.44-.8-2.08c-.76-.8-1.6-.8-1.98-.84C16.4 4 12 4 12 4h-.02s-4.4 0-6.8.28c-.38.04-1.22.04-1.98.84C2.6 5.76 2.4 7.2 2.4 7.2S2.2 8.88 2.2 10.56v1.84c0 1.68.2 3.36.2 3.36s.2 1.44.8 2.08c.76.8 1.76.76 2.2.84 1.6.16 6.6.28 6.6.28s4.4 0 6.8-.28c.38-.04 1.22-.04 1.98-.84.6-.64.8-2.08.8-2.08s.2-1.68.2-3.36v-1.84c0-1.68-.2-3.36-.2-3.36ZM9.76 13.96V8.8l5.2 2.6-5.2 2.56Z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Pagamentos / segurança */}
        <div className="mt-6 rounded-2xl border border-pink-500/20 bg-noir-950 text-white px-6 py-5 shadow-[0_10px_40px_rgba(184,15,90,0.08)]">
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70 font-semibold">Formas de pagamento</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl bg-black text-white px-4 py-2 text-xs font-semibold tracking-wide shadow-sm">
                Mastercard
              </span>
              <span className="rounded-xl bg-[#1a1f71] text-white px-4 py-2 text-xs font-semibold tracking-wide shadow-sm">
                Visa
              </span>
              <span className="rounded-xl bg-[#016fd0] text-white px-4 py-2 text-xs font-semibold tracking-wide shadow-sm">
                Amex
              </span>
              <span className="rounded-xl bg-black text-white px-4 py-2 text-xs font-semibold tracking-wide shadow-sm">
                Elo
              </span>
              <span className="rounded-xl bg-[#01855b] text-white px-4 py-2 text-xs font-semibold tracking-wide shadow-sm">
                Pix
              </span>
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
            {logoUrl ? (
              <Image src={logoUrl} alt="BelaPop" width={28} height={28} className="h-7 w-auto object-contain" />
            ) : (
              <span className="font-semibold tracking-[0.3em] text-noir-900 dark:text-blush-50">BelaPop</span>
            )}
            <span className="font-semibold">© 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em]">
            <Link href="/catalogo" className="rounded-full bg-noir-900 px-4 py-2 text-blush-50 shadow md:bg-noir-950">
              Comprar agora
            </Link>
            <Link href="/contato" className="rounded-full border border-luxe-600 px-4 py-2 text-luxe-600 hover:bg-luxe-50">
              Falar com concierge
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
