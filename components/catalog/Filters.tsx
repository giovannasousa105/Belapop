"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Facets = {
  brands: string[];
  brandCounts?: Record<string, number>;
  tagCounts?: Record<string, number>;
  minPrice: number;
  maxPrice: number;
};

type LegacyFacetCount = { name: string; count: number };
type LegacyCatalogFiltersProps = {
  facets: {
    brands: LegacyFacetCount[];
    priceRange: { min: number; max: number };
  };
  [key: string]: unknown;
};

const TAGS = [
  { key: "vegan", label: "Vegano" },
  { key: "cruelty_free", label: "Cruelty-free" },
  { key: "fragrance_free", label: "Sem fragrância" },
  { key: "sensitive_skin", label: "Pele sensível" },
  { key: "barrier_support", label: "Proteção de barreira" },
  { key: "sem_ressecar", label: "Sem ressecar" },
  { key: "bp_curated", label: "Curadoria BelaPop" },
  { key: "giftable", label: "Presenteável" },
  { key: "sensory", label: "Sensorial" }
];

const BRASILIDADES = [
  { key: "hair_crespo", label: "Crespo (4A-4C)" },
  { key: "hair_cacheado", label: "Cacheado (2C-3C)" },
  { key: "hair_ondulado", label: "Ondulado (2A-2C)" },
  { key: "hair_transicao", label: "Transição capilar" },
  { key: "skin_tone_deep", label: "Pele negra (tons profundos)" },
  { key: "skin_tone_rich", label: "Pele retinta" },
  { key: "skin_tone_medium", label: "Pele morena" },
  { key: "skin_hyperpigmentation", label: "Hiperpigmentação" },
  { key: "no_gray_cast", label: "Não deixa aspecto acinzentado" },
  { key: "glow_deep_skin", label: "Acabamento luminoso em peles profundas" },
  { key: "no_white_cast", label: "Sem efeito esbranquicado" },
  { key: "high_pigment", label: "Alta pigmentação" }
];

const RITUAIS = [
  "Ritual Noturno",
  "Presença Diurna",
  "Essência Sensorial",
  "Edição Limitada"
];
const TEXTURAS = ["Balm", "Oleo", "Creme", "Serum", "Bruma", "Gel"];

function CheckboxRow({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1 text-sm text-bpBlack">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--bp-pink)]"
      />
      <span>{label}</span>
    </label>
  );
}

function withCount(label: string, count: number) {
  return `${label} (${count})`;
}

export function Filters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [openMobile, setOpenMobile] = useState(false);

  const selectedBrands = sp.getAll("brand");
  const selectedTags = sp.getAll("tags");

  const ritual = sp.get("ritual") ?? "";
  const texture = sp.get("texture") ?? "";
  const stock = sp.get("stock") ?? "";
  const min = sp.get("min") ?? "";
  const max = sp.get("max") ?? "";

  const brandSearch = useMemo(() => "", []);
  const brands = facets.brands.filter((brand) =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const brandCounts = facets.brandCounts ?? {};
  const tagCounts = facets.tagCounts ?? {};
  const drawerTitleId = "catalog-filters-title";
  const drawerPanelId = "catalog-filters-panel";

  function update(fn: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(sp.toString());
    fn(params);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleMulti(key: "brand" | "tags", value: string) {
    update((p) => {
      const all = p.getAll(key);
      const exists = all.includes(value);
      p.delete(key);
      const next = exists ? all.filter((x) => x !== value) : [...all, value];
      next.forEach((x) => p.append(key, x));
    });
  }

  const Panel = (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Filtros</p>
        <p className="mt-2 text-xs text-bpGraphite/60">
          Cada produto pode ter condições de envio e prazo diferentes.
        </p>
      </div>

      {/* Preço */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">Preço</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="sr-only" htmlFor="min">
              Preço mínimo
            </label>
            <input
              id="min"
              value={min}
              onChange={(e) =>
                update((p) =>
                  e.target.value ? p.set("min", e.target.value) : p.delete("min")
                )
              }
              placeholder={`Min R$ ${facets.minPrice}`}
              className="w-full rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2 text-sm outline-none placeholder:text-bpGraphite/50"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="max">
              Preço máximo
            </label>
            <input
              id="max"
              value={max}
              onChange={(e) =>
                update((p) =>
                  e.target.value ? p.set("max", e.target.value) : p.delete("max")
                )
              }
              placeholder={`Max R$ ${facets.maxPrice}`}
              className="w-full rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2 text-sm outline-none placeholder:text-bpGraphite/50"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Até R$ 49", min: "", max: "49" },
            { label: "R$ 50-99", min: "50", max: "99" },
            { label: "R$ 100-199", min: "100", max: "199" },
            { label: "R$ 200+", min: "200", max: "" }
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                update((p) => {
                  preset.min ? p.set("min", preset.min) : p.delete("min");
                  preset.max ? p.set("max", preset.max) : p.delete("max");
                })
              }
              className="rounded-full border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-1 text-xs text-bpBlack hover:bg-[#fff9f8]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disponibilidade */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">
          Disponibilidade
        </p>
        <div className="mt-2">
          <CheckboxRow
            checked={stock === "1"}
            label="Em estoque"
            onChange={(v) => update((p) => (v ? p.set("stock", "1") : p.delete("stock")))}
          />
        </div>
      </div>

      {/* Ritual */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">Ritual</p>
        <label className="sr-only" htmlFor="ritual-select">
          Filtrar por ritual
        </label>
        <select
          id="ritual-select"
          aria-label="Filtrar por ritual"
          value={ritual}
          onChange={(e) =>
            update((p) =>
              e.target.value ? p.set("ritual", e.target.value) : p.delete("ritual")
            )
          }
          className="mt-3 w-full rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2 text-sm outline-none"
        >
          <option value="">Todos</option>
          {RITUAIS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Textura */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">Textura</p>
        <label className="sr-only" htmlFor="texture-select">
          Filtrar por textura
        </label>
        <select
          id="texture-select"
          aria-label="Filtrar por textura"
          value={texture}
          onChange={(e) =>
            update((p) =>
              e.target.value ? p.set("texture", e.target.value) : p.delete("texture")
            )
          }
          className="mt-3 w-full rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2 text-sm outline-none"
        >
          <option value="">Todas</option>
          {TEXTURAS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Marcas */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">Marcas</p>
        <div className="mt-2 max-h-48 overflow-auto rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2">
          {brands.length ? (
            brands.map((b) => (
              <CheckboxRow
                key={b}
                checked={selectedBrands.includes(b)}
                label={withCount(b, brandCounts[b] ?? 0)}
                onChange={() => toggleMulti("brand", b)}
              />
            ))
          ) : (
            <p className="text-sm text-bpGraphite/70">Sem marcas.</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">Seleção</p>
        <div className="mt-2 rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2">
          {TAGS.map((t) => (
            <CheckboxRow
              key={t.key}
              checked={selectedTags.includes(t.key)}
              label={withCount(t.label, tagCounts[t.key] ?? 0)}
              onChange={() => toggleMulti("tags", t.key)}
            />
          ))}
        </div>
      </div>

      {/* Brasilidades */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/70">
          Produtos de origem nacional
        </p>
        <p className="mt-1 text-xs text-bpGraphite/60">
          Seleção construída considerando diferentes tipos e tons de pele.
        </p>
        <p className="mt-1 text-xs text-bpGraphite/60">
          Critérios baseados em formulação, acabamento e adaptação na pele.
        </p>
        <div className="mt-3 rounded-[18px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-3 py-2">
          {BRASILIDADES.map((item) => (
            <CheckboxRow
              key={item.key}
              checked={selectedTags.includes(item.key)}
              label={withCount(item.label, tagCounts[item.key] ?? 0)}
              onChange={() => toggleMulti("tags", item.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: botao */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          aria-haspopup="dialog"
          aria-expanded={openMobile}
          aria-controls={drawerPanelId}
          className="w-full rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/86 px-4 py-3 text-xs uppercase tracking-[0.22em] text-bpBlack shadow-[0_10px_28px_rgba(91,49,56,0.04)]"
        >
          Filtrar
        </button>

        {openMobile && (
          <div
            id={drawerPanelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            className="fixed inset-0 z-50"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpenMobile(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-[28px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.6)_100%)] p-5 shadow-[0_-12px_44px_rgba(91,49,56,0.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <p
                  id={drawerTitleId}
                  className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70"
                >
                  Filtros
                </p>
                <button
                  type="button"
                  onClick={() => setOpenMobile(false)}
                  aria-label="Fechar painel de filtros"
                  className="text-sm text-bpPink"
                >
                  Fechar
                </button>
              </div>
              <div className="mt-6">{Panel}</div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(pathname)}
                  aria-label="Limpar filtros"
                  className="flex-1 rounded-[20px] border border-[rgba(216,160,172,0.18)] bg-white px-4 py-3 text-xs uppercase tracking-[0.22em]"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setOpenMobile(false)}
                  aria-label="Aplicar filtros"
                  className="flex-1 rounded-[20px] bg-bpBlackSoft px-4 py-3 text-xs uppercase tracking-[0.22em] text-bpOffWhite"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden rounded-[28px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.34)_100%)] p-5 shadow-[0_18px_48px_rgba(91,49,56,0.05)] md:block">
        {Panel}
      </aside>
    </>
  );
}

export function CatalogFilters(props: LegacyCatalogFiltersProps) {
  const brandsRaw = props.facets?.brands ?? [];
  const brands = brandsRaw.map((item) => item.name);
  const brandCounts = brandsRaw.reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = item.count;
    return acc;
  }, {});
  const minPrice = Math.max(0, Math.floor(props.facets?.priceRange?.min ?? 0));
  const maxPrice = Math.max(minPrice, Math.ceil(props.facets?.priceRange?.max ?? minPrice));

  return (
    <Filters
      facets={{
        brands,
        brandCounts,
        minPrice,
        maxPrice
      }}
    />
  );
}
