"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDebounce } from "@/lib/hooks/useDebounce";
import { trackEvent } from "@/lib/analytics/tracker";
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

type SearchFacet = { name: string; count: number };

type SearchResponse = {
  products: SearchProduct[];
  brands: SearchFacet[];
  categories: SearchFacet[];
  normalizedQuery: string;
};

type SearchBarProps = {
  tone?: "light" | "dark";
  className?: string;
  placeholder?: string;
  action?: string;
};

export const SearchBar = ({
  tone = "light",
  className,
  placeholder = "Busque produtos, marcas, rituais",
  action = "/catalogo"
}: SearchBarProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const debounced = useDebounce(query, 250);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toneClasses = useMemo(() => {
    return tone === "light"
      ? {
          wrapper: "border-black/10 bg-white text-bpGraphite shadow-sm",
          input: "text-bpBlackSoft placeholder:text-bpGraphite/60",
          icon: "text-bpGraphite/60"
        }
      : {
          wrapper: "border-white/10 bg-bpBlackSoft/70 text-bpPinkSoft/70",
          input: "text-bpOffWhite placeholder:text-bpPinkSoft/50",
          icon: "text-bpPinkSoft/50"
        };
  }, [tone]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debounced || debounced.length < 2) {
        setResults(null);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
        const json = (await res.json()) as SearchResponse;
        setResults(json);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchResults();
  }, [debounced]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    void trackEvent({
      type: "search",
      metadata: {
        query: normalizedQuery,
        surface: "global_search",
        action
      }
    });
    router.push(`${action}?q=${encodeURIComponent(normalizedQuery)}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className ?? ""}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${toneClasses.wrapper}`}
      >
        <Search size={16} className={toneClasses.icon} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-sm outline-none ${toneClasses.input}`}
        />
      </form>

      {open && results ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-3xl border border-black/10 bg-white p-4 shadow-xl">
          {loading ? (
            <p className="text-sm text-bpGraphite/70">Buscando...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
                  Produtos
                </p>
                <div className="mt-3 space-y-3">
                  {results.products.length ? (
                    results.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/produto/${product.slug}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm transition hover:border-bpPink/40"
                      >
                        <div>
                          <p className="font-semibold text-bpBlackSoft">
                            {product.name}
                          </p>
                          <p className="text-xs text-bpGraphite/70">
                            {product.brand ?? "Curadoria BelaPop"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-bpBlackSoft">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-bpGraphite/70">
                      Nenhum produto encontrado.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
                    Marcas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {results.brands.length ? (
                      results.brands.map((brand) => (
                        <Link
                          key={brand.name}
                          href={`${action}?q=${encodeURIComponent(
                            results.normalizedQuery
                          )}&brand=${encodeURIComponent(brand.name)}`}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs text-bpGraphite hover:border-bpPink/40"
                        >
                          {brand.name} ({brand.count})
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-bpGraphite/70">
                        Nenhuma marca.
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
                    Categorias
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {results.categories.length ? (
                      results.categories.map((category) => (
                        <Link
                          key={category.name}
                          href={`${action}?q=${encodeURIComponent(
                            results.normalizedQuery
                          )}&category=${encodeURIComponent(category.name)}`}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs text-bpGraphite hover:border-bpPink/40"
                        >
                          {category.name} ({category.count})
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-bpGraphite/70">
                        Nenhuma categoria.
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`${action}?q=${encodeURIComponent(
                    results.normalizedQuery
                  )}`}
                  className="inline-flex rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-bpGraphite hover:border-bpPink/40"
                >
                  Ver todos os resultados
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
