"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { SkinScanTopBar } from "@/components/popclub/skin-scan/SkinScanTopBar";

const footerColumns = [
  {
    title: "Fluxo IA",
    links: [
      { label: "Objetivos", href: "/skin-scan" },
      { label: "Captura", href: "/skin-scan/captura" },
      { label: "Diagnostico", href: "/skin-scan/diagnostico" }
    ]
  },
  {
    title: "Curadoria",
    links: [
      { label: "Skincare", href: "/skincare" },
      { label: "Vitrine", href: "/vitrine" },
      { label: "Diario", href: "/diario" }
    ]
  },
  {
    title: "Institucional",
    links: [
      { label: "Sobre a BelaPop", href: "/sobre" },
      { label: "Privacidade", href: "/aviso-de-privacidade" },
      { label: "Contato", href: "/contato" }
    ]
  }
] as const;

type SkinScanScaffoldProps = {
  children: ReactNode;
  tone?: "light" | "dark";
};

export function SkinScanScaffold({
  children,
  tone = "dark"
}: SkinScanScaffoldProps) {
  const isLight = tone === "light";
  const shellClassName = isLight ? "bg-[#fcf9f8] text-[#1c1b1b]" : "bg-[#0c0a0b] text-[#fcf9f8]";

  return (
    <div className={shellClassName}>
      <SkinScanTopBar />

      <div className="pt-16 lg:pt-[88px]">{children}</div>

      <footer className="border-t border-white/8 bg-black px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-6">
            <span className="font-editorial text-2xl tracking-[-0.05em]">BelaPop</span>
            <p className="max-w-xs text-[10px] uppercase tracking-[0.2em] text-white/50">
              Precision in aesthetics. Ciencia, imagem e luxo em um fluxo digital mobile first.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                {column.title}
              </h2>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[10px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/5 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            &copy; 2026 BelaPop. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
