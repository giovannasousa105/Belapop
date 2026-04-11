"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { trackEvent } from "@/lib/analytics/tracker";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatPrice } from "@/lib/utils";

type SearchProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
};

type SearchFacet = {
  name: string;
  count: number;
};

type SearchResponse = {
  products: SearchProduct[];
  brands: SearchFacet[];
  categories: SearchFacet[];
  normalizedQuery: string;
};

type GlobalProductSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildHighlightRegex = (query: string) => {
  const terms = Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 1)
    )
  );

  if (!terms.length) return null;
  return new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
};

const renderHighlightedText = (text: string, query: string) => {
  const regex = buildHighlightRegex(query);
  if (!regex) return text;

  return text.split(regex).map((part, index) => {
    if (!part) return null;
    if (!part.match(regex)) {
      return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    }

    return (
      <mark
        key={`${part}-${index}`}
        className="rounded-[0.35rem] bg-bpPinkLux px-1 text-bpBlack"
      >
        {part}
      </mark>
    );
  });
};

export function GlobalProductSearchOverlay({
  open,
  onClose
}: GlobalProductSearchOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const productLinkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const debouncedQuery = useDebounce(query, 220);
  const hasSearchIntent = query.trim().length >= 2;

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 70);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.clearTimeout(focusTimer);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setActiveProductIndex(-1);
      setResults(null);
      setLoading(false);
      productLinkRefs.current = [];
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const normalized = debouncedQuery.trim();
    if (normalized.length < 2) {
      setResults(null);
      setLoading(false);
      setActiveProductIndex(-1);
      return;
    }

    let cancelled = false;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}&limit=8`);
        const payload = (await response.json()) as SearchResponse;
        if (!cancelled) {
          setResults(payload);
        }
      } catch {
        if (!cancelled) {
          setResults({
            products: [],
            brands: [],
            categories: [],
            normalizedQuery: normalized
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchResults();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (!results?.products.length) {
      setActiveProductIndex(-1);
      return;
    }

    setActiveProductIndex(0);
  }, [results?.normalizedQuery, results?.products.length]);

  useEffect(() => {
    if (activeProductIndex < 0) return;
    const target = productLinkRefs.current[activeProductIndex];
    target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeProductIndex]);

  const submitSearch = (nextQuery?: string) => {
    const normalized = (nextQuery ?? query).trim();
    if (!normalized) return;

    void trackEvent({
      type: "search",
      metadata: {
        query: normalized,
        surface: "header_overlay",
        pathname
      }
    });

    router.push(`/catalogo?q=${encodeURIComponent(normalized)}`);
    onClose();
  };

  const openProduct = (product: SearchProduct) => {
    void trackEvent({
      type: "search",
      metadata: {
        query: query.trim() || results?.normalizedQuery || product.name,
        surface: "header_overlay_preview",
        pathname,
        product_id: product.id
      }
    });

    router.push(`/produto/${product.slug}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-[rgba(14,10,12,0.26)] backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-label="Busca de produtos BelaPop"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Fechar busca"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col px-3 pb-4 pt-[78px] sm:px-6 sm:pb-6 sm:pt-[92px]">
        <div className="mx-auto w-full max-w-[980px] rounded-[28px] border border-[rgba(216,160,172,0.22)] bg-[linear-gradient(180deg,rgba(255,253,252,0.98),rgba(246,232,234,0.96)_100%)] p-3 shadow-[0_24px_70px_rgba(32,17,21,0.24)] sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <form
              className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[rgba(216,160,172,0.26)] bg-white/86 px-4 py-3 shadow-[0_12px_30px_rgba(91,49,56,0.08)]"
              onSubmit={(event) => {
                event.preventDefault();
                if (results?.products.length && activeProductIndex >= 0) {
                  openProduct(results.products[activeProductIndex]);
                  return;
                }
                submitSearch();
              }}
            >
              <Search size={18} className="shrink-0 text-bpGraphite/68" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  const products = results?.products ?? [];
                  if (!products.length) return;

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveProductIndex((current) =>
                      current < products.length - 1 ? current + 1 : products.length - 1
                    );
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveProductIndex((current) => (current > 0 ? current - 1 : 0));
                  }

                  if (event.key === "Enter" && activeProductIndex >= 0) {
                    event.preventDefault();
                    openProduct(products[activeProductIndex]);
                  }
                }}
                placeholder="Buscar por produto, marca, categoria ou efeito..."
                className="w-full min-w-0 bg-transparent text-sm text-bpBlack outline-none placeholder:text-bpGraphite/52 sm:text-base"
                aria-activedescendant={
                  activeProductIndex >= 0 ? `search-preview-product-${activeProductIndex}` : undefined
                }
                aria-autocomplete="list"
                aria-controls="search-preview-products"
              />
              {query ? (
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bpBlack/10 text-bpGraphite/72 transition hover:border-bpPink/35 hover:text-bpBlack"
                  aria-label="Limpar busca"
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    setActiveProductIndex(-1);
                    inputRef.current?.focus();
                  }}
                >
                  <X size={14} />
                </button>
              ) : null}
            </form>

            <button
              type="button"
              className="hidden rounded-full bg-bpPinkCta px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_36px_rgba(213,30,113,0.2)] transition hover:bg-[#c91b67] sm:inline-flex"
              onClick={() => submitSearch()}
            >
              Ver no catalogo
            </button>

            <button
              type="button"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bpBlack/10 bg-white/84 text-bpBlack transition hover:border-bpPink/35 hover:text-bpRoseGold"
              aria-label="Fechar busca"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {hasSearchIntent ? (
          <div className="mx-auto mt-4 w-full max-w-[1320px] overflow-hidden rounded-[30px] border border-[rgba(216,160,172,0.22)] bg-[linear-gradient(180deg,rgba(255,253,252,0.98),rgba(246,232,234,0.96)_100%)] shadow-[0_30px_90px_rgba(32,17,21,0.24)]">
            <div className="max-h-[calc(100vh-190px)] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-[28px] border border-[rgba(216,160,172,0.16)] bg-white/72 p-4"
                    >
                      <div className="aspect-[4/4.6] rounded-[22px] bg-bpPinkLux/45" />
                      <div className="mt-4 h-4 rounded-full bg-bpPinkLux/38" />
                      <div className="mt-2 h-3 w-2/3 rounded-full bg-bpPinkLux/28" />
                    </div>
                  ))}
                </div>
              ) : results ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.32em] text-bpRoseGold">
                        Resultados para &quot;{results.normalizedQuery}&quot;
                      </p>
                      <p className="mt-2 text-sm leading-6 text-bpGraphite/84">
                        Use as setas para navegar, Enter para abrir o produto, ou siga para o catalogo.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 self-start rounded-full border border-bpBlack/12 bg-white/78 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-bpBlack transition hover:border-bpPink/35 hover:text-bpRoseGold"
                      onClick={() => submitSearch(results.normalizedQuery)}
                    >
                      Ver todos
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {results.products.length ? (
                    <div
                      id="search-preview-products"
                      role="listbox"
                      aria-label="Resultados de produtos"
                      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                    >
                      {results.products.map((product, index) => (
                        <Link
                          key={product.id}
                          id={`search-preview-product-${index}`}
                          ref={(node) => {
                            productLinkRefs.current[index] = node;
                          }}
                          href={`/produto/${product.slug}`}
                          role="option"
                          aria-selected={activeProductIndex === index}
                          className={`group overflow-hidden rounded-[30px] border bg-white/84 shadow-[0_18px_42px_rgba(91,49,56,0.06)] transition hover:-translate-y-1 hover:shadow-[0_26px_56px_rgba(91,49,56,0.1)] ${
                            activeProductIndex === index
                              ? "border-bpPink/60 ring-2 ring-bpPink/18"
                              : "border-[rgba(216,160,172,0.18)]"
                          }`}
                          onMouseEnter={() => setActiveProductIndex(index)}
                          onFocus={() => setActiveProductIndex(index)}
                          onClick={onClose}
                        >
                          <div className="relative flex aspect-[4/4.1] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#2d1821_0%,#502131_100%)]">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <>
                                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(248,210,222,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
                                <span className="font-display text-[4.2rem] text-white/32">B</span>
                              </>
                            )}
                            <span className="absolute left-4 top-4 rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/88 backdrop-blur">
                              {product.category ?? "curadoria"}
                            </span>
                          </div>
                          <div className="p-4 sm:p-5">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-bpRoseGold">
                              {renderHighlightedText(product.brand ?? "BelaPop", query)}
                            </p>
                            <h3 className="mt-3 font-display text-[1.45rem] leading-[1.02] text-bpBlack">
                              {renderHighlightedText(product.name, query)}
                            </h3>
                            <div className="mt-4 flex items-end justify-between gap-3">
                              <span className="text-lg font-semibold text-bpBlack">
                                {formatPrice(product.price)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-bpGraphite/74">
                                <Sparkles size={12} />
                                preview
                              </span>
                            </div>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">
                              {renderHighlightedText(product.category ?? "curadoria premium", query)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[30px] border border-[rgba(216,160,172,0.18)] bg-white/78 p-6">
                      <p className="font-display text-[1.8rem] text-bpBlack">Nada apareceu nessa busca.</p>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-bpGraphite/84">
                        Tente ajustar o termo ou siga para o catalogo para explorar por filtros.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
