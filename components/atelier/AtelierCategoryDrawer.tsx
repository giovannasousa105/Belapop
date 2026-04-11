"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, User, X } from "lucide-react";
import { useEffect } from "react";

import { popClubPaths } from "@/lib/popclub/navigation";

const drawerLinks = [
  { label: "Inicio", href: "/" },
  { label: "Skincare", href: "/skincare" },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Perfumes", href: "/perfumes" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Skin Scan Bela", href: "/skin-scan" },
  { label: "Diario BelaPop", href: "/diario" }
] as const;

type AtelierCategoryDrawerProps = {
  activeHref: string;
  onClose: () => void;
  open: boolean;
  title?: string;
};

export function AtelierCategoryDrawer({
  activeHref,
  onClose,
  open,
  title = "ATELIER"
}: AtelierCategoryDrawerProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm lg:hidden">
      <div className="absolute inset-y-0 left-0 flex w-[84vw] max-w-sm flex-col bg-[#fcf9f8] px-5 pb-8 pt-5 text-[#1c1b1b] shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-editorial text-2xl font-bold tracking-tight">{title}</span>
          <button
            type="button"
            aria-label="Fechar menu"
            className="inline-flex h-11 w-11 items-center justify-center"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-5">
          {drawerLinks.map((item) => {
            const isActive = item.href === activeHref;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`border-b pb-4 font-editorial text-2xl transition-colors ${
                  isActive
                    ? "border-[#ed93d5] text-[#ed93d5]"
                    : "border-black/10 text-[#1c1b1b]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 pt-8">
          <Link
            href={popClubPaths.landing}
            onClick={onClose}
            className="group block rounded-[30px] border border-black/8 bg-[linear-gradient(180deg,#111111,#1a1718)] px-5 py-6 text-white shadow-[0_22px_50px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <Sparkles className="h-4 w-4 text-[#ed93d5]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                PopClub
              </span>
            </div>
            <p className="font-editorial text-[1.75rem] leading-[0.94]">Curadoria premium e beneficios exclusivos.</p>
            <p className="mt-3 text-sm leading-relaxed text-white/82">
              Acesse radar, membership e rotina personalizada no hub premium da BelaPop.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
              Entrar no clube
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={popClubPaths.radar}
              onClick={onClose}
              className="rounded-[22px] border border-black/10 bg-white px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:border-[#ed93d5]/40 hover:text-[#ed93d5]"
            >
              Radar
            </Link>
            <Link
              href={popClubPaths.routine}
              onClick={onClose}
              className="rounded-[22px] border border-black/10 bg-white px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:border-[#ed93d5]/40 hover:text-[#ed93d5]"
            >
              Rotina
            </Link>
          </div>

          <Link
            href="/conta"
            onClick={onClose}
            className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          >
            <User className="h-4 w-4" />
            Minha conta
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
