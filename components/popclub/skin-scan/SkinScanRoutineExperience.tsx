"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";

import { ImmersiveBottomNav } from "@/components/popclub/shared/ImmersiveBottomNav";
import { ImmersiveMenuDrawer } from "@/components/popclub/shared/ImmersiveMenuDrawer";
import { routineBottomNavItems, routineMenuLinks } from "@/lib/popclub/navigation";
import { useCart } from "@/lib/CartContext";
import {
  SKIN_ANALYSIS_SESSION_STORAGE_KEY,
  skinAnalysisSessionSchema,
  type SkinAnalysisSession,
  type SkinAnalysisProduct,
  type ScienceRoutineSession
} from "@/lib/skincare/skinAnalysis";

const formatPrice = (cents: number | null) =>
  cents != null
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)
    : "—";

const totalPrice = (products: SkinAnalysisProduct[]) =>
  products.reduce((acc, p) => acc + (p.priceCents ?? 0), 0);

function ProductCard({
  product,
  reverse,
  index,
  onAdd,
  added
}: {
  product: SkinAnalysisProduct;
  reverse: boolean;
  index: number;
  onAdd: () => void;
  added: boolean;
}) {
  return (
    <article className="group">
      <div
        className={`flex flex-col gap-8 md:gap-10 lg:items-center lg:gap-12 ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        }`}
      >
        <div className="w-full md:w-1/2">
          <div className="aspect-[4/5] overflow-hidden bg-[#f0eded]">
            {product.heroImageUrl ? (
              <img
                src={product.heroImageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f5ede9] to-[#ede4df]">
                <span className="text-center text-[10px] uppercase tracking-[0.2em] text-[#8E5B68]/60">
                  {product.category ?? "Skincare"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col justify-center md:w-1/2">
          <span className="mb-1 text-[10px] uppercase tracking-[0.3em] text-[#444748]">
            {product.brand ?? "BelaPop"}
          </span>
          <span className="mb-1 text-[9px] uppercase tracking-[0.2em] text-[#8E5B68]">
            Passo {String(index + 1).padStart(2, "0")}
          </span>
          <h4 className="font-[var(--font-playfair)] text-2xl lg:text-4xl">{product.name}</h4>

          {product.category && (
            <p className="mb-2 mt-1 text-[10px] uppercase tracking-[0.14em] text-[#444748]">
              {product.category}
            </p>
          )}

          <div className="mb-6 border-l border-black/10 bg-[#f6f3f2] p-4 text-xs italic leading-relaxed mt-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] not-italic">
              Por que este produto?
            </span>
            {product.reason}
          </div>

          <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-[var(--font-playfair)] text-lg lg:text-2xl">
              {formatPrice(product.priceCents)}
            </span>
            <button
              type="button"
              onClick={onAdd}
              className={`inline-flex min-h-12 w-full items-center justify-center px-6 text-[10px] uppercase tracking-[0.18em] transition-all sm:w-auto lg:min-h-14 lg:px-8 ${
                added
                  ? "bg-[#2D6A4F] text-white"
                  : "bg-black text-white hover:opacity-85"
              }`}
            >
              {added ? "Adicionado ✓" : "Incluir na rotina"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SkinScanRoutineExperience() {
  const router = useRouter();
  const { addItem } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<SkinAnalysisSession | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(SKIN_ANALYSIS_SESSION_STORAGE_KEY);
      if (!raw) {
        router.replace("/skin-scan/captura");
        return;
      }
      const parsed = skinAnalysisSessionSchema.parse(JSON.parse(raw));
      setSession(parsed);
    } catch {
      window.sessionStorage.removeItem(SKIN_ANALYSIS_SESSION_STORAGE_KEY);
      router.replace("/skin-scan/captura");
    }
  }, [router]);

  const handleAdd = (product: SkinAnalysisProduct) => {
    addItem(product.id, 1, product.sellerId ?? undefined);
    setAddedIds((prev) => new Set(prev).add(product.id));
  };

  const handleAddAll = () => {
    if (!session) return;
    session.recommendedProducts.forEach((p) => {
      addItem(p.id, 1, p.sellerId ?? undefined);
    });
    setAddedIds(new Set(session.recommendedProducts.map((p) => p.id)));
  };

  const products = session?.recommendedProducts ?? [];
  const analysis = session?.analysis;
  const scienceRoutine: ScienceRoutineSession | undefined = session?.scienceRoutine;
  const goals = analysis?.topConcerns ?? [];
  const summary = analysis?.summary ?? "";

  const scienceManha = scienceRoutine?.manha ?? [];
  const scienceNoite = scienceRoutine?.noite ?? [];
  const scienceSemanal = scienceRoutine?.semanal ?? [];

  const morningSteps = scienceManha.length > 0
    ? scienceManha.map((s) => s.name)
    : (analysis?.routineRecommendation.morning ?? []);
  const nightSteps = scienceNoite.length > 0
    ? scienceNoite.map((s) => s.name)
    : (analysis?.routineRecommendation.night ?? []);

  const morningProducts = products.slice(0, Math.max(1, Math.ceil(products.length / 2)));
  const nightProducts = products.slice(Math.max(1, Math.ceil(products.length / 2)));

  const total = totalPrice(products);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fcf9f8] pb-24 text-[#1c1b1b]">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-30">
        <div className="absolute left-[-10%] top-[18%] h-[36vh] w-[60vw] rounded-full bg-[#f7e382]/18 blur-[120px]" />
        <div className="absolute bottom-[8%] right-[-10%] h-[42vh] w-[56vw] rounded-full bg-[#e5e2e1]/50 blur-[110px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#1a1a1a] transition-opacity hover:opacity-70"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-[var(--font-playfair)] text-2xl font-bold uppercase tracking-tight text-[#1a1a1a]">
            BelaPop
          </h1>
          <Link
            href="/carrinho"
            className="inline-flex h-10 w-10 items-center justify-center text-[#1a1a1a] transition-opacity hover:opacity-70"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <ImmersiveMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Skin Scan"
        links={routineMenuLinks}
        searchPlaceholder="Buscar rotina"
      />

      <main className="mx-auto max-w-6xl px-6 pb-40 pt-24 lg:px-10 lg:pt-32">
        {/* ── Hero ── */}
        <section className="mb-16 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.62fr)] xl:gap-12">
          <div>
            <h2 className="font-[var(--font-playfair)] text-5xl leading-tight tracking-tighter lg:max-w-3xl lg:text-7xl lg:leading-[1.04]">
              Sua rotina personalizada
            </h2>
            {summary && (
              <p className="mb-4 mt-4 text-base leading-relaxed text-[#444748] lg:text-lg">
                {summary}
              </p>
            )}
            {scienceRoutine?.skinProfile && (
              <p className="mb-4 border-l-2 border-[#C17A90] pl-4 text-sm leading-relaxed text-[#444748]">
                {scienceRoutine.skinProfile}
              </p>
            )}
            <p className="mb-2 text-xs font-light italic text-[#444748]">
              Baseada no seu Skin Scan
            </p>
          </div>

          {goals.length > 0 && (
            <div className="bg-[#f6f3f2] p-8 border-l-4 border-black xl:self-start">
              <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-[#444748]/70">
                Focos desta rotina
              </p>
              <ul className="space-y-4">
                {goals.map((goal) => (
                  <li key={goal} className="flex items-center gap-4">
                    <span className="h-1.5 w-1.5 flex-shrink-0 bg-[#C17A90]" />
                    <span className="text-xs uppercase tracking-[0.2em]">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ── Ativos científicos ── */}
        {scienceRoutine?.topActives && scienceRoutine.topActives.length > 0 && (
          <section className="mb-16 border-y border-black/10 py-8">
            <p className="mb-4 text-[9px] uppercase tracking-[0.28em] text-[#444748]/70">
              Ativos indicados pela ciência para o seu perfil
            </p>
            <div className="flex flex-wrap gap-2">
              {scienceRoutine.topActives.map((active) => (
                <span
                  key={active}
                  className="inline-flex items-center bg-[#f6f3f2] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#1c1b1b]"
                >
                  {active}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Manhã ── */}
        {morningSteps.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-black/10 pb-2">
              <h3 className="font-[var(--font-playfair)] text-3xl italic lg:text-5xl">Manhã</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">07:00 – 08:30</span>
            </div>
            <ol className="mb-10 space-y-4">
              {scienceManha.length > 0
                ? scienceManha.map((step, i) => (
                    <li key={step.slug} className="grid gap-1">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-[#C17A90]">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                      <p className="pl-8 text-[10px] uppercase tracking-[0.14em] text-[#444748]/80">
                        {step.ritual}
                      </p>
                    </li>
                  ))
                : morningSteps.map((step, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm text-[#444748]">
                      <span className="text-[10px] font-bold text-[#C17A90]">{String(i + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
            </ol>
            {morningProducts.length > 0 && (
              <div className="space-y-16 lg:space-y-20">
                {morningProducts.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    reverse={i % 2 !== 0}
                    index={i}
                    onAdd={() => handleAdd(product)}
                    added={addedIds.has(product.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Noite ── */}
        {nightSteps.length > 0 && (
          <section className="mb-20">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-black/10 pb-2">
              <h3 className="font-[var(--font-playfair)] text-3xl italic lg:text-5xl">Noite</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">21:00 – 23:00</span>
            </div>
            <ol className="mb-10 space-y-4">
              {scienceNoite.length > 0
                ? scienceNoite.map((step, i) => (
                    <li key={step.slug} className="grid gap-1">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-[#C17A90]">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                      <p className="pl-8 text-[10px] uppercase tracking-[0.14em] text-[#444748]/80">
                        {step.ritual}
                      </p>
                    </li>
                  ))
                : nightSteps.map((step, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm text-[#444748]">
                      <span className="text-[10px] font-bold text-[#C17A90]">{String(i + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
            </ol>

            {nightProducts.length > 0 && (
              <article className="bg-black p-8 text-white md:p-10 lg:p-12">
                <div className="flex flex-col gap-10 md:flex-row md:items-center lg:gap-12">
                  <div className="w-full md:w-[34%]">
                    <div className="aspect-square overflow-hidden">
                      {nightProducts[0].heroImageUrl ? (
                        <img
                          src={nightProducts[0].heroImageUrl}
                          alt={nightProducts[0].name}
                          className="h-full w-full object-cover brightness-90"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#1c1b1b]">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                            {nightProducts[0].category ?? "Skincare"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="mb-1 block text-[10px] uppercase tracking-[0.3em] text-white/50">
                      {nightProducts[0].brand ?? "BelaPop"}
                    </span>
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[#C17A90]/70">
                      Tratamento Noturno
                    </span>
                    <h4 className="font-[var(--font-playfair)] text-3xl lg:text-5xl">
                      {nightProducts[0].name}
                    </h4>
                    <p className="mb-8 mt-4 text-base font-light leading-relaxed text-white/80 lg:max-w-2xl">
                      {nightProducts[0].reason}
                    </p>

                    <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-[var(--font-playfair)] text-xl lg:text-3xl">
                        {formatPrice(nightProducts[0].priceCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(nightProducts[0])}
                        className={`inline-flex min-h-12 w-full items-center justify-center px-6 text-[10px] uppercase tracking-[0.18em] transition-all sm:w-auto lg:min-h-14 lg:px-8 ${
                          addedIds.has(nightProducts[0].id)
                            ? "bg-[#2D6A4F] text-white"
                            : "bg-[#f7e382] text-black hover:opacity-90"
                        }`}
                      >
                        {addedIds.has(nightProducts[0].id) ? "Adicionado ✓" : "Incluir na rotina"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </section>
        )}

        {/* ── Semanal ── */}
        {scienceSemanal.length > 0 && (
          <section className="mb-16 bg-[#f6f3f2] p-8 lg:p-10">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-black/10 pb-2">
              <h3 className="font-[var(--font-playfair)] text-3xl italic lg:text-5xl">Semanal</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">2× por semana</span>
            </div>
            <ol className="space-y-4">
              {scienceSemanal.map((step, i) => (
                <li key={step.slug} className="grid gap-1">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-[#C17A90]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                  <p className="pl-8 text-[10px] uppercase tracking-[0.14em] text-[#444748]/80">
                    {step.whyRecommended}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── Fallback: sem produtos ── */}
        {products.length === 0 && session && (
          <div className="my-16 border border-black/10 p-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#444748]">
              Curadoria em preparo
            </p>
            <p className="mt-3 font-[var(--font-playfair)] text-2xl">
              Novidades chegando em breve
            </p>
            <p className="mt-3 text-sm text-[#444748]">
              Estamos montando a seleção ideal para o seu perfil. Explore o catálogo enquanto isso.
            </p>
            <Link
              href="/skincare"
              className="mt-6 inline-flex min-h-12 items-center justify-center bg-black px-6 text-[10px] uppercase tracking-[0.18em] text-white"
            >
              Ver catálogo de skincare
            </Link>
          </div>
        )}

        {/* ── Resumo da rotina ── */}
        {products.length > 0 && (
          <section className="mt-24 border-t-2 border-black pt-16">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.56fr)] xl:gap-16">
              <div>
                <h3 className="mb-12 font-[var(--font-playfair)] text-4xl tracking-tighter lg:text-6xl">
                  Sua rotina selecionada
                </h3>

                <div className="space-y-6">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-6 border-b border-black/10 py-4"
                    >
                      <div>
                        <p className="font-[var(--font-playfair)] text-lg lg:text-2xl">{item.name}</p>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#444748]">
                          {item.category ?? item.matchedConcern}
                        </p>
                      </div>
                      <span className="text-sm lg:text-base">{formatPrice(item.priceCents)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="xl:sticky xl:top-28 xl:self-start">
                <div className="space-y-8 bg-white/70 p-8 ring-1 ring-black/[0.05] backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-[#444748]/65">
                        Curadoria final
                      </p>
                      <p className="mt-2 font-[var(--font-playfair)] text-2xl">
                        {products.length} {products.length === 1 ? "item selecionado" : "itens selecionados"}
                      </p>
                    </div>
                    <div className="text-right text-[10px] uppercase tracking-[0.2em] text-[#444748]/70">
                      Envio com rastreio
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-xs font-bold uppercase tracking-[0.4em]">
                      Total da rotina
                    </span>
                    <span className="font-[var(--font-playfair)] text-4xl lg:text-5xl">
                      {total > 0 ? formatPrice(total) : "—"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAll}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-4 bg-black px-6 text-xs uppercase tracking-[0.3em] text-white transition-colors hover:bg-[#444748]"
                  >
                    <span>Levar rotina ao carrinho</span>
                    <span aria-hidden="true">→</span>
                  </button>

                  <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[#444748]/70">
                    Produtos da rotina seguem seller identificado e prazo informado no pedido
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <ImmersiveBottomNav items={routineBottomNavItems} />
    </div>
  );
}
