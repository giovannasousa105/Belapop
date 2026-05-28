import type { RotinaPasso, SkinRotina, TipoPele } from "@/types/skin-scan";

type Periodo = "manha" | "noite" | "semanal";

type CatalogProduct = Omit<RotinaPasso, "ordem"> & {
  skinTypes: TipoPele[];
  addresses: string[];
  periodo: Periodo[];
};

export const BELAPOP_CATALOG: Record<string, CatalogProduct> = {
  "gel-limpeza-veludo": {
    slug: "gel-limpeza-veludo",
    nome: "Gel Limpeza Veludo",
    categoria: "limpeza",
    preco: 219,
    skinTypes: ["oleosa", "mista", "normal", "sensivel"],
    addresses: ["oleosidade", "poros", "acne", "textura", "brilho"],
    periodo: ["manha", "noite"],
    ativosChave: ["glucosideo de decila", "glicerina 3%", "extrato de camomila"],
    porQueRecomendado:
      "Surfactantes suaves ajudam a limpar sem deslocar excessivamente lipideos da barreira, mantendo o pH fisiologico e reduzindo risco de efeito rebote.",
    comoUsar:
      "Aplique na pele umida, massageie em movimentos circulares por 60 segundos e enxague com agua fria ou morna. Use de manha e a noite.",
    evidencia: { grau: "A", fonte: "AAD 2024 - Cleansing Guidelines" },
  },
  "tonico-nuvem-de-rosa": {
    slug: "tonico-nuvem-de-rosa",
    nome: "Tonico Nuvem de Rosa",
    categoria: "tonico",
    preco: 159,
    skinTypes: ["seca", "normal", "sensivel", "mista"],
    addresses: ["hidratacao", "sensibilidade", "uniformidade", "vermelhidao"],
    periodo: ["manha", "noite"],
    ativosChave: ["acido hialuronico 0.5%", "agua de rosas", "pantenol 2%"],
    porQueRecomendado:
      "Acido hialuronico e pantenol aumentam conforto imediato e ajudam a reduzir perda transepidermica de agua em peles desidratadas.",
    comoUsar:
      "Depois da limpeza, aplique com as maos ou algodao suave. Deixe a pele levemente umida antes do proximo passo.",
    evidencia: { grau: "A", fonte: "PubMed PMID:23467882 - Papakonstantinou 2012" },
  },
  "serum-radiance-01": {
    slug: "serum-radiance-01",
    nome: "Serum Radiance 01",
    categoria: "serum",
    preco: 289,
    skinTypes: ["oleosa", "mista", "normal"],
    addresses: ["oleosidade", "poros", "manchas", "textura", "uniformidade", "acne", "brilho"],
    periodo: ["noite"],
    ativosChave: ["niacinamida 10%", "acido glicolico 5%", "zinco PCA 1%"],
    porQueRecomendado:
      "Niacinamida auxilia controle de sebo e aparencia de poros; acido glicolico melhora textura por renovacao gradual quando usado a noite.",
    comoUsar:
      "Use apenas a noite. Aplique 3 a 4 gotas, espere 5 minutos e finalize com hidratante. Comece 2 vezes por semana nas duas primeiras semanas.",
    alertaSinergia: "Use protetor solar no dia seguinte. Evite combinar com retinoides na mesma noite.",
    evidencia: { grau: "A", fonte: "Draelos 2006 JAAD + Bernstein 1996 JAAD" },
  },
  "creme-barrier-celeste": {
    slug: "creme-barrier-celeste",
    nome: "Creme Barrier Celeste",
    categoria: "hidratante",
    preco: 259,
    skinTypes: ["seca", "sensivel", "mista", "normal"],
    addresses: ["hidratacao", "sensibilidade", "descamacao", "barreira", "vermelhidao"],
    periodo: ["manha", "noite"],
    ativosChave: ["ceramidas NP/AP/EOP 5%", "esqualano 3%", "colesterol", "acido hialuronico 1%"],
    porQueRecomendado:
      "Ceramidas, colesterol e lipideos biomimeticos reforcam a barreira cutanea e reduzem sinais de ressecamento e sensibilidade.",
    comoUsar:
      "Aplique como ultimo passo de tratamento. A noite use uma camada generosa; de manha use camada fina antes do protetor.",
    evidencia: { grau: "A", fonte: "Elias 2008, J Invest Dermatol 128(8):1997-2007" },
  },
  "protetor-solar-luz-de-vela-fps50": {
    slug: "protetor-solar-luz-de-vela-fps50",
    nome: "Protetor Solar Luz de Vela FPS50",
    categoria: "protetor",
    preco: 189,
    skinTypes: ["seca", "oleosa", "mista", "normal", "sensivel"],
    addresses: ["fotoprotecao", "envelhecimento", "manchas", "acne", "uniformidade"],
    periodo: ["manha"],
    ativosChave: ["FPS50+", "dioxido de titanio 5%", "avobenzona 3%", "niacinamida 2%"],
    porQueRecomendado:
      "Fotoprotecao diaria e o passo com melhor evidencia para prevenir fotoenvelhecimento e piora de manchas.",
    comoUsar:
      "Use como ultimo passo da manha, 15 a 20 minutos antes do sol. Aplique 1/4 de colher de cha no rosto e pescoco e reaplique em exposicao direta.",
    alertaSinergia: "Nao misture com base ou hidratante; aplique em camada propria para manter o FPS.",
    evidencia: { grau: "A", fonte: "Hughes 2013 NEJM + AAD 2024 Sunscreen Guidelines" },
  },
  "patch-olhos-aurora": {
    slug: "patch-olhos-aurora",
    nome: "Patch Olhos Aurora",
    categoria: "tratamento",
    preco: 149,
    skinTypes: ["seca", "normal", "mista", "sensivel"],
    addresses: ["linhas", "linhas_finas", "olheiras", "inchaco", "cansaco"],
    periodo: ["semanal"],
    ativosChave: ["cafeina 2%", "peptideo de cobre", "acido hialuronico", "retinol 0.025%"],
    porQueRecomendado:
      "Cafeina ajuda a reduzir edema peri-orbital por vasoconstricao; peptideos apoiam firmeza visual em linhas finas.",
    comoUsar:
      "Guarde na geladeira e aplique sob os olhos por 20 minutos, 2 vezes por semana. Remova e massageie o excesso.",
    alertaSinergia: "Contem retinol em baixa dose; evitar em gestantes.",
    evidencia: { grau: "B", fonte: "Lupo 2001 Dermatol Surg + Pickart 2009" },
  },
};

export const ACTIVE_MATRIX: Record<
  string,
  {
    prioridade: Record<TipoPele, number>;
    evidencia: { grau: "A" | "B" | "C"; fonte: string };
    contraindicacoes: TipoPele[];
  }
> = {
  niacinamida: {
    prioridade: { oleosa: 10, mista: 9, normal: 7, seca: 5, sensivel: 6 },
    evidencia: { grau: "A", fonte: "Draelos 2006, JAAD 54:1043" },
    contraindicacoes: [],
  },
  acido_glicolico: {
    prioridade: { oleosa: 9, mista: 8, normal: 8, seca: 5, sensivel: 2 },
    evidencia: { grau: "A", fonte: "Bernstein 1996, JAAD 34:187" },
    contraindicacoes: ["sensivel"],
  },
  acido_hialuronico: {
    prioridade: { seca: 10, sensivel: 10, normal: 8, mista: 7, oleosa: 5 },
    evidencia: { grau: "A", fonte: "Papakonstantinou 2012, Dermato-Endocrinology" },
    contraindicacoes: [],
  },
  ceramidas: {
    prioridade: { seca: 10, sensivel: 10, normal: 7, mista: 7, oleosa: 4 },
    evidencia: { grau: "A", fonte: "Elias 2008, J Invest Dermatol" },
    contraindicacoes: [],
  },
  fps50: {
    prioridade: { oleosa: 10, mista: 10, seca: 10, normal: 10, sensivel: 10 },
    evidencia: { grau: "A", fonte: "Hughes 2013, NEJM 368:1491" },
    contraindicacoes: [],
  },
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeFocus = (value: string) => {
  const normalized = normalizeText(value);
  if (normalized.includes("hidrat") || normalized.includes("ressec")) return "hidratacao";
  if (normalized.includes("oleos") || normalized.includes("brilho")) return "oleosidade";
  if (normalized.includes("mancha") || normalized.includes("hiperpig")) return "manchas";
  if (normalized.includes("linha") || normalized.includes("firme")) return "linhas";
  if (normalized.includes("sens") || normalized.includes("vermelh")) return "sensibilidade";
  if (normalized.includes("poro")) return "poros";
  if (normalized.includes("textura")) return "textura";
  if (normalized.includes("olheira") || normalized.includes("olhos")) return "olheiras";
  if (normalized.includes("acne") || normalized.includes("cravo")) return "acne";
  return normalized;
};

export function normalizeFocos(focos: string[]) {
  return [...new Set(focos.map(normalizeFocus).filter(Boolean))];
}

function buildPasso(slug: string, ordem: number): RotinaPasso {
  const produto = BELAPOP_CATALOG[slug];
  if (!produto) throw new Error(`Produto ${slug} nao encontrado`);

  return {
    ordem,
    slug: produto.slug,
    nome: produto.nome,
    categoria: produto.categoria,
    preco: produto.preco,
    ativosChave: produto.ativosChave,
    porQueRecomendado: produto.porQueRecomendado,
    comoUsar: produto.comoUsar,
    alertaSinergia: produto.alertaSinergia,
    evidencia: produto.evidencia,
  };
}

function addUnique(list: RotinaPasso[], slug: string) {
  if (list.some((item) => item.slug === slug)) return;
  list.push(buildPasso(slug, list.length + 1));
}

export function buildRotina(
  tipoPele: TipoPele,
  focos: string[],
  achados: Record<string, string | undefined>
): SkinRotina {
  const normalizedFocos = normalizeFocos(focos);
  const achadosText = Object.values(achados).filter(Boolean).join(" ");

  const has = (...keys: string[]) =>
    keys.some((key) => normalizedFocos.includes(key) || achadosText.includes(key));

  const manha: RotinaPasso[] = [];
  addUnique(manha, "gel-limpeza-veludo");

  if (
    ["seca", "sensivel", "normal", "mista"].includes(tipoPele) ||
    has("hidratacao", "sensibilidade", "vermelhidao", "descamacao")
  ) {
    addUnique(manha, "tonico-nuvem-de-rosa");
  }

  if (tipoPele === "seca" || tipoPele === "sensivel" || has("hidratacao", "descamacao")) {
    addUnique(manha, "creme-barrier-celeste");
  }

  addUnique(manha, "protetor-solar-luz-de-vela-fps50");

  const noite: RotinaPasso[] = [];
  addUnique(noite, "gel-limpeza-veludo");

  if (["seca", "sensivel"].includes(tipoPele) || has("hidratacao", "sensibilidade")) {
    addUnique(noite, "tonico-nuvem-de-rosa");
  }

  if (
    ["oleosa", "mista"].includes(tipoPele) ||
    has("oleosidade", "poros", "acne", "manchas", "textura")
  ) {
    addUnique(noite, "serum-radiance-01");
  }

  addUnique(noite, "creme-barrier-celeste");

  const semanal: RotinaPasso[] = [];
  if (
    has("olheiras", "linhas", "cansaco") ||
    Boolean(achados.linhasFinas && achados.linhasFinas !== "ausentes")
  ) {
    addUnique(semanal, "patch-olhos-aurora");
  }

  const semana1 =
    tipoPele === "sensivel" || has("sensibilidade", "descamacao")
      ? noite.filter((step) => step.slug !== "serum-radiance-01")
      : undefined;

  return { manha, noite, semanal, semana1 };
}
