"use client";

import { type ReactNode, useMemo, useState } from "react";

type FacetCount = { name: string; count: number };
type AvailabilityValue = "in_stock" | "ready_delivery" | "out_of_stock" | "all";
type AccordionKey =
  | "price"
  | "availability"
  | "brand"
  | "category"
  | "moment"
  | "ritual"
  | "texture"
  | "finish"
  | "skin"
  | "sensation"
  | "result"
  | "tags";

type FiltersProps = {
  facets: {
    brands: FacetCount[];
    categories: FacetCount[];
    rituals: FacetCount[];
    textures: FacetCount[];
    sensations: FacetCount[];
    results: FacetCount[];
    moments: FacetCount[];
    skinTypes: FacetCount[];
    finishes: FacetCount[];
    tags: FacetCount[];
    availability: {
      inStock: number;
      readyDelivery: number;
      outOfStock: number;
    };
    priceRange: { min: number; max: number };
  };
  brands: string[];
  categories: string[];
  moments: string[];
  rituals: string[];
  textures: string[];
  finishes: string[];
  skinTypes: string[];
  sensations: string[];
  results: string[];
  tags: string[];
  curated: boolean;
  isNew: boolean;
  availability: AvailabilityValue;
  priceMinInput: string;
  priceMaxInput: string;
  filtersOpen: boolean;
  resultsCount: number;
  onClose: () => void;
  onClearFilters: () => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onApplyPriceRange: () => void;
  onSelectPricePreset: (min: number | null, max: number | null) => void;
  onToggleBrand: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleMoment: (value: string) => void;
  onToggleRitual: (value: string) => void;
  onToggleTexture: (value: string) => void;
  onToggleFinish: (value: string) => void;
  onToggleSkinType: (value: string) => void;
  onToggleSensation: (value: string) => void;
  onToggleResult: (value: string) => void;
  onToggleTag: (value: string) => void;
  onToggleCurated: () => void;
  onToggleIsNew: () => void;
  onSetAvailability: (value: AvailabilityValue) => void;
  showSkincareFilters: boolean;
  showMakeFilters: boolean;
  formatPrice: (value: number) => string;
};

type AccordionSectionProps = {
  id: AccordionKey;
  title: string;
  openSections: Record<AccordionKey, boolean>;
  onToggle: (id: AccordionKey) => void;
  children: ReactNode;
};

const PRICE_PRESETS = [
  { label: "Ate R$ 49", min: null, max: 49 },
  { label: "R$ 50 - 99", min: 50, max: 99 },
  { label: "R$ 100 - 199", min: 100, max: 199 },
  { label: "R$ 200+", min: 200, max: null }
] as const;

function FilterCheckbox({
  id,
  label,
  checked,
  onChange
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm text-bpGraphite hover:bg-bpOffWhite"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-black/30 text-bpPink focus-visible:outline-bpPink"
      />
      <span>{label}</span>
    </label>
  );
}

function AccordionSection({
  id,
  title,
  openSections,
  onToggle,
  children
}: AccordionSectionProps) {
  const contentId = `catalog-filter-${id}`;
  const isOpen = openSections[id];

  return (
    <section className="border-b border-black/10 pb-4 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-2 text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onToggle(id)}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-bpGraphite/75">
          {title}
        </span>
        <span className="text-xs text-bpGraphite/60">{isOpen ? "Ocultar" : "Mostrar"}</span>
      </button>
      <div id={contentId} className={isOpen ? "mt-2" : "hidden"}>
        {children}
      </div>
    </section>
  );
}

function FiltersContent({
  facets,
  brands,
  categories,
  moments,
  rituals,
  textures,
  finishes,
  skinTypes,
  sensations,
  results,
  tags,
  curated,
  isNew,
  availability,
  priceMinInput,
  priceMaxInput,
  onPriceMinChange,
  onPriceMaxChange,
  onApplyPriceRange,
  onSelectPricePreset,
  onToggleBrand,
  onToggleCategory,
  onToggleMoment,
  onToggleRitual,
  onToggleTexture,
  onToggleFinish,
  onToggleSkinType,
  onToggleSensation,
  onToggleResult,
  onToggleTag,
  onToggleCurated,
  onToggleIsNew,
  onSetAvailability,
  showSkincareFilters,
  showMakeFilters,
  formatPrice
}: Omit<FiltersProps, "filtersOpen" | "onClose" | "onClearFilters" | "resultsCount">) {
  const [brandQuery, setBrandQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<AccordionKey, boolean>>({
    price: true,
    availability: true,
    brand: true,
    category: false,
    moment: true,
    ritual: false,
    texture: false,
    finish: true,
    skin: true,
    sensation: false,
    result: false,
    tags: true
  });

  const toggleSection = (id: AccordionKey) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const normalizedBrandQuery = brandQuery.trim().toLowerCase();
  const filteredBrands = useMemo(() => {
    if (!normalizedBrandQuery) return facets.brands;
    return facets.brands.filter((brand) =>
      brand.name.toLowerCase().includes(normalizedBrandQuery)
    );
  }, [facets.brands, normalizedBrandQuery]);

  const minFacet = Math.floor(facets.priceRange.min || 0);
  const computedMax = Math.ceil(facets.priceRange.max || 0);
  const maxFacet = computedMax > minFacet ? computedMax : minFacet + 1;
  const minValue = Number(priceMinInput || minFacet);
  const maxValue = Number(priceMaxInput || maxFacet);
  const safeMin = Number.isFinite(minValue) ? Math.min(minValue, maxValue) : minFacet;
  const safeMax = Number.isFinite(maxValue) ? Math.max(maxValue, safeMin) : maxFacet;

  return (
    <div className="space-y-4 text-sm text-bpGraphite">
      <AccordionSection id="price" title="Faixa de preco" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onSelectPricePreset(preset.min, preset.max)}
                className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-bpGraphite hover:border-bpPink/35"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 rounded-2xl border border-black/10 bg-bpOffWhite p-3">
            <label htmlFor="catalog-price-min-slider" className="text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/70">
              Minimo
            </label>
            <input
              id="catalog-price-min-slider"
              type="range"
              min={minFacet}
              max={maxFacet}
              value={safeMin}
              onChange={(event) => onPriceMinChange(event.target.value)}
              onMouseUp={onApplyPriceRange}
              onTouchEnd={onApplyPriceRange}
              className="w-full accent-bpPink"
            />
            <label htmlFor="catalog-price-max-slider" className="text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/70">
              Maximo
            </label>
            <input
              id="catalog-price-max-slider"
              type="range"
              min={minFacet}
              max={maxFacet}
              value={safeMax}
              onChange={(event) => onPriceMaxChange(event.target.value)}
              onMouseUp={onApplyPriceRange}
              onTouchEnd={onApplyPriceRange}
              className="w-full accent-bpPink"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="catalog-price-min" className="mb-1 block text-xs text-bpGraphite/70">
                  Min
                </label>
                <input
                  id="catalog-price-min"
                  value={priceMinInput}
                  onChange={(event) => onPriceMinChange(event.target.value)}
                  onBlur={onApplyPriceRange}
                  inputMode="numeric"
                  placeholder={formatPrice(minFacet)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-bpGraphite"
                />
              </div>
              <div>
                <label htmlFor="catalog-price-max" className="mb-1 block text-xs text-bpGraphite/70">
                  Max
                </label>
                <input
                  id="catalog-price-max"
                  value={priceMaxInput}
                  onChange={(event) => onPriceMaxChange(event.target.value)}
                  onBlur={onApplyPriceRange}
                  inputMode="numeric"
                  placeholder={formatPrice(maxFacet)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-bpGraphite"
                />
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="availability" title="Disponibilidade" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          <FilterCheckbox
            id="availability-ready-delivery"
            checked={availability === "ready_delivery"}
            onChange={() => onSetAvailability("ready_delivery")}
            label={`Pronta entrega (${facets.availability.readyDelivery})`}
          />
          <FilterCheckbox
            id="availability-in-stock"
            checked={availability === "in_stock"}
            onChange={() => onSetAvailability("in_stock")}
            label={`Em estoque (${facets.availability.inStock})`}
          />
          <FilterCheckbox
            id="availability-out-of-stock"
            checked={availability === "out_of_stock"}
            onChange={() => onSetAvailability("out_of_stock")}
            label={`Esgotado (${facets.availability.outOfStock})`}
          />
          <FilterCheckbox
            id="availability-all"
            checked={availability === "all"}
            onChange={() => onSetAvailability("all")}
            label="Todos"
          />
        </div>
      </AccordionSection>

      <AccordionSection id="brand" title="Marca" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-3">
          <label htmlFor="brand-search" className="text-xs text-bpGraphite/70">
            Buscar marca
          </label>
          <input
            id="brand-search"
            value={brandQuery}
            onChange={(event) => setBrandQuery(event.target.value)}
            placeholder="Digite para filtrar marcas..."
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-bpGraphite"
          />
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {filteredBrands.map((brand) => (
              <FilterCheckbox
                key={brand.name}
                id={`brand-${brand.name}`}
                checked={brands.includes(brand.name)}
                onChange={() => onToggleBrand(brand.name)}
                label={`${brand.name} (${brand.count})`}
              />
            ))}
            {!filteredBrands.length ? (
              <p className="px-2 py-1 text-xs text-bpGraphite/65">Sem marcas nesta selecao.</p>
            ) : null}
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="category" title="Categoria" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.categories.map((category) => (
            <FilterCheckbox
              key={category.name}
              id={`category-${category.name}`}
              checked={categories.includes(category.name)}
              onChange={() => onToggleCategory(category.name)}
              label={`${category.name} (${category.count})`}
            />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="moment" title="Momento" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.moments.map((moment) => (
            <FilterCheckbox
              key={moment.name}
              id={`moment-${moment.name}`}
              checked={moments.includes(moment.name)}
              onChange={() => onToggleMoment(moment.name)}
              label={`${moment.name} (${moment.count})`}
            />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="ritual" title="Ritual" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.rituals.map((ritual) => (
            <FilterCheckbox
              key={ritual.name}
              id={`ritual-${ritual.name}`}
              checked={rituals.includes(ritual.name)}
              onChange={() => onToggleRitual(ritual.name)}
              label={`${ritual.name} (${ritual.count})`}
            />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="texture" title="Textura" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.textures.map((texture) => (
            <FilterCheckbox
              key={texture.name}
              id={`texture-${texture.name}`}
              checked={textures.includes(texture.name)}
              onChange={() => onToggleTexture(texture.name)}
              label={`${texture.name} (${texture.count})`}
            />
          ))}
        </div>
      </AccordionSection>

      {showMakeFilters ? (
        <AccordionSection id="finish" title="Acabamento" openSections={openSections} onToggle={toggleSection}>
          <div className="space-y-1">
            {facets.finishes.map((finish) => (
              <FilterCheckbox
                key={finish.name}
                id={`finish-${finish.name}`}
                checked={finishes.includes(finish.name)}
                onChange={() => onToggleFinish(finish.name)}
                label={`${finish.name} (${finish.count})`}
              />
            ))}
          </div>
        </AccordionSection>
      ) : null}

      {showSkincareFilters ? (
        <AccordionSection id="skin" title="Tipo de pele/cabelo" openSections={openSections} onToggle={toggleSection}>
          <div className="space-y-1">
            {facets.skinTypes.map((skinType) => (
              <FilterCheckbox
                key={skinType.name}
                id={`skin-${skinType.name}`}
                checked={skinTypes.includes(skinType.name)}
                onChange={() => onToggleSkinType(skinType.name)}
                label={`${skinType.name} (${skinType.count})`}
              />
            ))}
          </div>
        </AccordionSection>
      ) : null}

      <AccordionSection id="sensation" title="Sensacao" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.sensations.map((sensation) => (
            <FilterCheckbox
              key={sensation.name}
              id={`sensation-${sensation.name}`}
              checked={sensations.includes(sensation.name)}
              onChange={() => onToggleSensation(sensation.name)}
              label={`${sensation.name} (${sensation.count})`}
            />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="result" title="Beneficio" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.results.map((resultItem) => (
            <FilterCheckbox
              key={resultItem.name}
              id={`result-${resultItem.name}`}
              checked={results.includes(resultItem.name)}
              onChange={() => onToggleResult(resultItem.name)}
              label={`${resultItem.name} (${resultItem.count})`}
            />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="tags" title="Etiquetas de confianca" openSections={openSections} onToggle={toggleSection}>
        <div className="space-y-1">
          {facets.tags.map((tag) => (
            <FilterCheckbox
              key={tag.name}
              id={`tag-${tag.name}`}
              checked={tags.includes(tag.name)}
              onChange={() => onToggleTag(tag.name)}
              label={`${tag.name} (${tag.count})`}
            />
          ))}
          <FilterCheckbox
            id="tag-curadoria"
            checked={curated}
            onChange={onToggleCurated}
            label="Curadoria BelaPop"
          />
          <FilterCheckbox
            id="tag-new"
            checked={isNew}
            onChange={onToggleIsNew}
            label="Novidades (30 dias)"
          />
        </div>
      </AccordionSection>
    </div>
  );
}

export function CatalogFilters({ filtersOpen, onClose, onClearFilters, resultsCount, ...props }: FiltersProps) {
  return (
    <>
      <aside className="hidden md:block">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Filtros editoriais</p>
          <div className="mt-5">
            <FiltersContent {...props} />
          </div>
        </div>
      </aside>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[80] bg-black/45 md:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[86vh] rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Filtros</p>
              <button
                type="button"
                onClick={onClose}
                className="text-xs uppercase tracking-[0.24em] text-bpGraphite"
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[calc(86vh-86px-88px)] overflow-y-auto px-6 py-5">
              <FiltersContent {...props} />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-black/10 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-black/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-bpGraphite"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex flex-[1.3] items-center justify-center rounded-full bg-bpBlack px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-bpOffWhite"
              >
                Aplicar ({resultsCount})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
