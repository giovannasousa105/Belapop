import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { reels } from "@/lib/diario/data";

export const metadata: Metadata = {
  title: "Reels BelaPop | Skincare em movimento",
  description: "Vídeos curtos de rotinas, ingredientes e texturas. Skincare explicado de forma direta e visual."
};

export default function ReelsPage() {
  return (
    <>
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-24 pt-28 text-[#1c1b1b] lg:pt-36">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8179]">
            <Link href="/guias" className="flex items-center gap-1 hover:text-[#1c1b1b]">
              <ArrowLeft className="h-3.5 w-3.5" /> Guias
            </Link>
            <span>/</span>
            <span className="text-[#1c1b1b]">Reels</span>
          </nav>

          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">Reels BelaPop</p>
          <h1 className="mt-3 font-headline text-5xl leading-[0.92] tracking-[-0.04em] sm:text-6xl">
            Skincare em movimento.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f5a55]">
            Rotinas, texturas, ingredientes e bastidores — em vídeos curtos e diretos.
          </p>

          <div className="mt-12">
            {reels.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {reels.map((reel) => (
                  <Link
                    key={reel.slug}
                    href={`/guias/reels/${reel.slug}`}
                    className="group overflow-hidden border border-[#ded8d2] bg-white transition hover:border-[#1c1b1b]"
                  >
                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#e8e4e0]">
                      {reel.thumbnailUrl ? (
                        <img src={reel.thumbnailUrl} alt={reel.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#1c1b1b]">
                          <span className="font-headline text-4xl text-white/20">B.</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/15 backdrop-blur-sm transition group-hover:scale-110">
                          <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      {reel.duration && (
                        <span className="absolute bottom-2 right-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{reel.duration}</span>
                      )}
                    </div>
                    <div className="p-3">
                      {reel.tag && <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c5e06]">{reel.tag}</p>}
                      <h3 className="mt-1.5 font-headline text-base leading-tight text-black">{reel.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-black/15 py-32 text-center">
                <span className="font-headline text-6xl text-black/10">▶</span>
                <p className="mt-4 font-headline text-2xl text-black/20">Reels em breve</p>
                <p className="mt-2 text-sm text-[#8a8179]">Os primeiros vídeos já estão sendo preparados.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
