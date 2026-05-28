export type ProductCategory =
  | "limpeza" | "tonico" | "serum" | "hidratante"
  | "protecao" | "olhos" | "cabelos" | "maquiagem";

export type SkinTypeFilter =
  | "oleosa" | "seca" | "mista" | "normal" | "sensivel";

export type ConcernFilter =
  | "acne" | "manchas" | "oleosidade" | "hidratacao"
  | "linhas-finas" | "poros" | "luminosidade" | "olheiras" | "textura";

export interface CatalogProduct {
  slug: string;
  name: string;
  price: number | null;
  category: ProductCategory;
  skinTypes: SkinTypeFilter[];
  concerns: ConcernFilter[];
  keyActives: string[];
  tags: string[];
  searchTerms: string[];
  ritual: "manha" | "noite" | "ambos" | "semanal" | "tratamento";
  isNew?: boolean;
  isBestSeller?: boolean;
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    slug: "gel-limpeza-veludo",
    name: "Gel Limpeza Veludo",
    price: 219,
    category: "limpeza",
    skinTypes: ["oleosa", "mista", "normal", "seca"],
    concerns: ["acne", "oleosidade", "poros", "textura"],
    keyActives: ["glucosideo de decil", "glicerina", "pantenol"],
    tags: ["limpeza", "gel", "sem sulfato", "limpeza facial", "sabonete", "cleanser"],
    searchTerms: ["lavar rosto", "limpar pele", "cleanser", "foam", "sabonete facial", "limpeza suave"],
    ritual: "ambos",
    isBestSeller: true,
  },
  {
    slug: "tonico-nuvem-de-rosa",
    name: "Tonico Nuvem de Rosa",
    price: null,
    category: "tonico",
    skinTypes: ["seca", "sensivel", "normal", "mista"],
    concerns: ["hidratacao", "luminosidade", "textura"],
    keyActives: ["agua de rosas", "acido hialuronico", "camomila", "niacinamida"],
    tags: ["tonico", "agua de rosas", "hidratante", "sem alcool", "preparo", "essencia"],
    searchTerms: ["toner", "essencia", "agua de rosas", "preparar pele", "hidratacao rapida"],
    ritual: "ambos",
  },
  {
    slug: "serum-radiance-01",
    name: "Serum Radiance 01",
    price: 289,
    category: "serum",
    skinTypes: ["oleosa", "mista", "normal"],
    concerns: ["manchas", "oleosidade", "luminosidade", "poros", "textura"],
    keyActives: ["niacinamida", "vitamina c", "acido hialuronico", "extrato de licorice"],
    tags: ["serum", "niacinamida", "vitamina c", "manchas", "clarear", "luminosidade", "noturno"],
    searchTerms: ["serum vitamina c", "clarear manchas", "hiperpigmentacao", "radiance", "glow", "iluminador"],
    ritual: "noite",
    isBestSeller: true,
  },
  {
    slug: "creme-barrier-celeste",
    name: "Creme Barrier Celeste",
    price: 320,
    category: "hidratante",
    skinTypes: ["seca", "sensivel", "normal"],
    concerns: ["hidratacao", "textura", "linhas-finas"],
    keyActives: ["ceramidas", "esqualano", "acido hialuronico", "pantenol"],
    tags: ["hidratante", "ceramidas", "barreira", "creme", "pele seca", "moisturizer"],
    searchTerms: ["hidratante facial", "creme moisturizer", "ceramida", "barreira cutanea", "pele seca hidratante"],
    ritual: "manha",
  },
  {
    slug: "protetor-solar-luz-de-vela-fps50",
    name: "Protetor Solar Luz de Vela FPS 50",
    price: 279,
    category: "protecao",
    skinTypes: ["oleosa", "mista", "normal", "seca", "sensivel"],
    concerns: ["manchas", "linhas-finas", "luminosidade", "oleosidade"],
    keyActives: ["tinosorb", "oxido de zinco", "niacinamida", "fps50"],
    tags: ["protetor solar", "fps50", "uva uvb", "anti-aging", "fotoprotetor"],
    searchTerms: ["fps", "spf", "sunscreen", "protetor", "anti-aging solar", "protetor solar fluido", "luz do sol"],
    ritual: "manha",
    isBestSeller: true,
  },
  {
    slug: "patch-olhos-aurora",
    name: "Patch Olhos Aurora",
    price: 198,
    category: "olhos",
    skinTypes: ["oleosa", "mista", "normal", "seca", "sensivel"],
    concerns: ["olheiras", "linhas-finas", "hidratacao"],
    keyActives: ["cafeina", "peptideos", "acido hialuronico", "cha branco"],
    tags: ["olheiras", "patch", "hidrogel", "area dos olhos", "bolsas", "cafeina"],
    searchTerms: ["olheira", "patch olho", "eye patch", "bolsas olhos", "cansaco olhos", "eye cream", "area periorbital"],
    ritual: "tratamento",
    isNew: true,
  },
  {
    slug: "oleo-capilar-nuit",
    name: "Oleo Capilar Nuit",
    price: 248,
    category: "cabelos",
    skinTypes: [],
    concerns: [],
    keyActives: ["oleo de argan", "vitamina e", "oleo de rosa mosqueta"],
    tags: ["cabelos", "oleo capilar", "hidratacao capilar", "brilho", "cacheado", "crespo"],
    searchTerms: ["oleo cabelo", "argan", "hidratacao capilar", "cabelo seco", "brilho cabelo", "leave-in", "hair oil"],
    ritual: "noite",
  },
  {
    slug: "blush-veu-rose",
    name: "Blush Veu Rose",
    price: null,
    category: "maquiagem",
    skinTypes: [],
    concerns: ["luminosidade"],
    keyActives: ["pigmentos naturais", "vitamina e"],
    tags: ["blush", "maquiagem", "corar", "rose", "luminoso", "glow"],
    searchTerms: ["blush", "rouge", "maquiagem bochechas", "cor natural", "makeup", "corar"],
    ritual: "manha",
    isNew: true,
  },
];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function normalizeSearchText(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function searchProducts(
  query: string,
  filters: {
    category?: ProductCategory | null;
    skinType?: SkinTypeFilter | null;
    concern?: ConcernFilter | null;
    priceMax?: number | null;
    ritual?: string | null;
  } = {}
): CatalogProduct[] {
  let results = [...CATALOG_PRODUCTS];

  if (query.trim()) {
    const q = normalizeSearchText(query.trim());
    results = results.filter((p) => {
      const searchable = normalizeSearchText(
        [p.name, p.category, ...p.keyActives, ...p.tags, ...p.searchTerms, ...p.concerns, ...p.skinTypes].join(" ")
      );
      return searchable.includes(q);
    });
  }

  if (filters.category) {
    results = results.filter((p) => p.category === filters.category);
  }

  if (filters.skinType) {
    results = results.filter(
      (p) => p.skinTypes.length === 0 || p.skinTypes.includes(filters.skinType!)
    );
  }

  if (filters.concern) {
    results = results.filter((p) => p.concerns.includes(filters.concern!));
  }

  if (filters.priceMax) {
    results = results.filter((p) => !p.price || p.price <= filters.priceMax!);
  }

  if (filters.ritual) {
    results = results.filter(
      (p) => p.ritual === filters.ritual || p.ritual === "ambos"
    );
  }

  return results;
}

export const QUICK_SEARCHES = [
  { label: "Para oleosa", query: "", filter: { skinType: "oleosa" as SkinTypeFilter } },
  { label: "Para manchas", query: "", filter: { concern: "manchas" as ConcernFilter } },
  { label: "Seruns", query: "", filter: { category: "serum" as ProductCategory } },
  { label: "Protetor solar", query: "protetor solar", filter: {} },
  { label: "Olheiras", query: "", filter: { concern: "olheiras" as ConcernFilter } },
  { label: "Vitamina C", query: "vitamina c", filter: {} },
  { label: "Limpeza", query: "", filter: { category: "limpeza" as ProductCategory } },
  { label: "Ceramidas", query: "ceramidas", filter: {} },
];
