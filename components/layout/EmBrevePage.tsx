import Link from "next/link";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";

type EmBrevePageProps = {
  titulo: string;
  subtitulo?: string;
};

export function EmBrevePage({ titulo, subtitulo }: EmBrevePageProps) {
  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <BelaPopValidatedHeader activeSection="skincare" />
      <main className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-6 pt-[72px] text-center lg:pt-[80px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#C88FA3]">
          Em breve
        </p>
        <h1 className="mt-4 font-['Cormorant_Garamond'] text-5xl font-light leading-[0.95] tracking-[-0.02em] text-[#1B1A18] md:text-6xl">
          {titulo}
        </h1>
        {subtitulo ? (
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#5F5A55]">{subtitulo}</p>
        ) : null}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/skincare"
            className="inline-flex items-center gap-2 rounded-full bg-[#1B1A18] px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#3d3530]"
          >
            Explorar Skincare
          </Link>
          <Link
            href="/skin-scan"
            className="inline-flex items-center gap-2 rounded-full border border-[#DDD3CA] bg-white/80 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1B1A18] transition hover:border-[#C88FA3]"
          >
            Fazer análise de pele
          </Link>
        </div>
      </main>
      <BelaPopValidatedFooter />
    </div>
  );
}
