import Link from "next/link";

import type { ReelItem, ArtigoItem, ReflexaoItem } from "@/lib/diario/data";

// ── Bloco de Reels ────────────────────────────────────────────────────────────

export function ReelsBloco({ reels, idPrefix = "diario" }: { reels: ReelItem[]; idPrefix?: string }) {
  return (
    <div id={`${idPrefix}-reels`} className="scroll-mt-24">
      <div className="flex items-end justify-between border-b border-black/10 pb-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">Reels</span>
          <h4 className="font-headline text-2xl leading-tight text-black sm:text-3xl">
            Skincare em movimento.
          </h4>
        </div>
        <Link
          href="/guias/reels"
          className="hidden shrink-0 border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition hover:opacity-50 lg:block"
        >
          Ver todos →
        </Link>
      </div>

      <div className="mt-6 -mx-4 sm:mx-0">
        {reels.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto px-4 pb-3 sm:px-0 sm:pb-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {reels.slice(0, 4).map((reel) => (
              <Link
                key={reel.slug}
                href={`/guias/reels/${reel.slug}`}
                className="group relative w-[160px] shrink-0 overflow-hidden lg:w-auto"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#e8e4e0]">
                  {reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1c1b1b]">
                      <span className="font-headline text-4xl text-white/20">B.</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/15 backdrop-blur-sm transition group-hover:scale-110">
                      <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {reel.duration && (
                    <span className="absolute bottom-2 right-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {reel.duration}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  {reel.tag && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c5e06]">
                      {reel.tag}
                    </p>
                  )}
                  <h5 className="font-headline text-base leading-tight text-black">{reel.title}</h5>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-black/15 py-16 text-center">
            <span className="font-headline text-4xl text-black/10">▶</span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-black/30">Reels em breve</p>
          </div>
        )}
      </div>

      <Link href="/guias/reels" className="mt-4 flex w-fit items-center border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black lg:hidden">
        Ver todos os reels →
      </Link>
    </div>
  );
}

// ── Bloco de Artigos ──────────────────────────────────────────────────────────

export function ArtigosBloco({ artigos, idPrefix = "diario" }: { artigos: ArtigoItem[]; idPrefix?: string }) {
  return (
    <div id={`${idPrefix}-artigos`} className="scroll-mt-24">
      <div className="flex items-end justify-between border-b border-black/10 pb-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">Artigos</span>
          <h4 className="font-headline text-2xl leading-tight text-black sm:text-3xl">
            Leitura que ajuda a decidir melhor.
          </h4>
        </div>
        <Link
          href="/guias/artigos"
          className="hidden border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition hover:opacity-50 lg:block"
        >
          Todos os artigos →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-12">
        {artigos.length > 0 ? (
          <>
            {artigos[0] && (
              <Link
                href={`/guias/artigos/${artigos[0].slug}`}
                className="group flex flex-col overflow-hidden bg-white transition hover:shadow-sm md:col-span-7 md:flex-row"
              >
                {artigos[0].coverUrl && (
                  <div className="aspect-video shrink-0 overflow-hidden md:aspect-auto md:w-2/5">
                    <img src={artigos[0].coverUrl} alt={artigos[0].title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between p-6 lg:p-8">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c5e06]">{artigos[0].tag}</span>
                      <span className="text-[10px] text-[#8a8179]">· {artigos[0].readTime} min</span>
                    </div>
                    <h5 className="mt-3 font-headline text-3xl leading-tight text-black">{artigos[0].title}</h5>
                    <p className="mt-3 text-sm leading-6 text-[#5f5a55]">{artigos[0].excerpt}</p>
                  </div>
                  <span className="mt-6 w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black">Ler artigo →</span>
                </div>
              </Link>
            )}
            <div className="flex flex-col gap-4 md:col-span-5">
              {artigos.slice(1, 3).map((artigo) => (
                <Link key={artigo.slug} href={`/guias/artigos/${artigo.slug}`} className="group flex flex-1 flex-col bg-white p-5 transition hover:shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c5e06]">{artigo.tag}</span>
                    <span className="text-[10px] text-[#8a8179]">· {artigo.readTime} min</span>
                  </div>
                  <h5 className="mt-3 font-headline text-xl leading-tight text-black">{artigo.title}</h5>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#5f5a55]">{artigo.excerpt}</p>
                  <span className="mt-4 w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black">Ler →</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="col-span-12 flex flex-col items-center justify-center border border-dashed border-black/15 py-16 text-center">
            <span className="font-headline text-4xl text-black/10">✦</span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-black/30">Artigos em breve</p>
          </div>
        )}
      </div>

      <Link href="/guias/artigos" className="mt-4 flex w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black lg:hidden">
        Todos os artigos →
      </Link>
    </div>
  );
}

// ── Bloco de Reflexões ────────────────────────────────────────────────────────

export function ReflexoesBloco({ reflexoes, idPrefix = "diario" }: { reflexoes: ReflexaoItem[]; idPrefix?: string }) {
  return (
    <div id={`${idPrefix}-reflexoes`} className="scroll-mt-24">
      <div className="flex items-end justify-between border-b border-black/10 pb-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">Reflexões</span>
          <h4 className="font-headline text-2xl leading-tight text-black sm:text-3xl">
            Pensamentos sobre pele e escolha.
          </h4>
        </div>
        <Link
          href="/guias/reflexoes"
          className="hidden border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition hover:opacity-50 lg:block"
        >
          Todas as reflexões →
        </Link>
      </div>

      <div className="mt-6 grid gap-0 divide-y divide-black/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {reflexoes.length > 0 ? (
          reflexoes.slice(0, 3).map((reflexao) => (
            <Link key={reflexao.slug} href={`/guias/reflexoes/${reflexao.slug}`} className="group flex flex-col bg-white p-6 transition hover:bg-[#fcf9f8]">
              <span className="font-headline text-4xl leading-none text-black/10 transition group-hover:text-[#6c5e06]/20">"</span>
              {reflexao.tema && (
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8179]">{reflexao.tema}</p>
              )}
              <h5 className="mt-3 font-headline text-xl leading-tight text-black">{reflexao.title}</h5>
              <p className="mt-3 flex-1 text-sm italic leading-7 text-[#5f5a55]">{reflexao.excerpt}</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black">Ler →</span>
                <span className="text-[10px] text-[#8a8179]">{reflexao.readTime} min</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center border border-dashed border-black/15 py-16 text-center">
            <span className="font-headline text-4xl text-black/10">"</span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-black/30">Reflexões em breve</p>
          </div>
        )}
      </div>

      <Link href="/guias/reflexoes" className="mt-4 flex w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black lg:hidden">
        Todas as reflexões →
      </Link>
    </div>
  );
}
