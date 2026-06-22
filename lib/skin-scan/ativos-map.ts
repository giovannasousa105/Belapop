/**
 * lib/skin-scan/ativos-map.ts
 *
 * Mapa de ativos cosméticos → descrição de benefício legível.
 * Usado no card de produto da rotina para mostrar o que cada ativo faz.
 * Lookup é case-insensitive via getBeneficio().
 */

export const ATIVOS_BENEFICIOS: Record<string, string> = {
  // ── Limpeza ────────────────────────────────────────────────────────────────
  "glucosídeo de decila": "Surfactante suave derivado de coco — limpa sem agredir a barreira cutânea",
  "cocamidopropil betaina": "Surfactante anfotérico — limpa e condiciona, reduz irritação",
  "lauril glucosídeo": "Surfactante não-iônico suave — ideal para pele sensível",

  // ── Hidratantes / Umectantes ───────────────────────────────────────────────
  "glicerina": "Umectante que atrai água para a pele e mantém a hidratação ao longo do dia",
  "glicerina 3%": "Umectante que atrai água para a pele e mantém a hidratação ao longo do dia",
  "acido hialuronico": "Hidratação profunda — molécula que atrai e retém até 1000× seu peso em água",
  "acido hialuronico de alto peso molecular": "Hidrata a superfície e reduz a perda d'água transepidérmica",
  "acido hialuronico de baixo peso molecular": "Penetra camadas mais profundas para hidratação sustentada",
  "pantenol": "Pró-vitamina B5 — hidratante, calmante e cicatrizante, reduz irritação",
  "esqualano": "Emoliente ultraleve derivado de azeitona — hidrata sem obstruir poros",
  "oleo de jojoba": "Similar ao sebo humano — equilibra a oleosidade e hidrata sem engordurar",
  "ceramidas": "Restauram a barreira cutânea — retêm umidade e protegem contra agressores externos",
  "ureia 5%": "Queratólise suave + hidratação intensa — remove células mortas e atrai água",
  "ureia 10%": "Queratólise e hidratação profunda — eficaz para ressecamento severo",

  // ── Uniformizadores / Antimanchas ─────────────────────────────────────────
  "niacinamida": "Vitamina B3 — controla oleosidade, reduz poros, uniformiza o tom e fortalece a barreira",
  "niacinamida 2%": "Vitamina B3 em concentração suave — controla oleosidade e uniformiza o tom",
  "niacinamida 5%": "Vitamina B3 terapêutica — combate manchas, poros e sebo em excesso",
  "niacinamida 10%": "Alta concentração de B3 — potente uniformizador e anti-inflamatório",
  "vitamina c": "Antioxidante potente — ilumina o tom, combate manchas e estimula colágeno",
  "vitamina c 10%": "Ácido L-ascórbico terapêutico — ação antioxidante e antimanchas visível",
  "vitamina c 20%": "Alta concentração — máxima eficácia clareadora e antioxidante",
  "acido kojico": "Inibidor de tirosinase derivado de fungo — clareia manchas com segurança",
  "alfa arbutina": "Inibidor de melanina biocompatível — clarea manchas com menor irritação que hidroquinona",
  "acido ferulico": "Potencializa vitamina C e E em até 8× — estabiliza e protege antioxidantes",
  "extrato de alcaçuz": "Glabridina — clareadora natural, anti-inflamatória e antioxidante",

  // ── Antienvelhecimento ─────────────────────────────────────────────────────
  "retinol": "Vitamina A — estimula renovação celular, reduz linhas finas e uniformiza a textura",
  "retinol 0,025%": "Concentração inicial de retinol — renovação suave para quem está começando",
  "retinol 0,05%": "Retinol intermediário — melhora textura e reduz linhas com tolerância gradual",
  "retinol 0,1%": "Retinol avançado — eficácia comprovada para antienvelhecimento",
  "tretinoina": "Vitamina A ácida prescrita — referência clínica para acne e antienvelhecimento",
  "peptideos": "Estimulam síntese de colágeno — melhoram firmeza e preenchem linhas de expressão",
  "peptideos de cobre": "Promovem colágeno, cicatrização e renovação — ação antioxidante e reparadora",
  "colageno marinho": "Suporte estrutural — melhora elasticidade e reduz aspecto flácido",
  "coenzima q10": "Antioxidante celular — protege mitocôndrias do envelhecimento oxidativo",
  "resveratrol": "Polifenol antioxidante potente — combate radicais livres e sinalização de envelhecimento",
  "astaxantina": "Carotenóide com 6000× o poder antioxidante da vitamina C",

  // ── Anti-acne / Controle sebáceo ──────────────────────────────────────────
  "acido salicilico": "BHA que desobstrui poros e combate acne — esfoliação de profundidade",
  "acido salicilico 0,5%": "Concentração suave de BHA — desobstrui poros sem irritar pele sensível",
  "acido salicilico 2%": "BHA terapêutico — eficaz para acne comedônica e controle sebáceo",
  "acido azelaico": "Anti-inflamatório e antibacteriano — combate acne e manchas pós-inflamatórias",
  "acido azelaico 10%": "Concentração terapêutica para acne leve a moderada e rosácea",
  "acido azelaico 20%": "Alta eficácia clínica para acne, rosácea e hiperpigmentação",
  "benzoil peroxido": "Bactericida — elimina P. acnes e desobstrui folículos pilosos",
  "zinco": "Regula a produção de sebo e tem ação antimicrobiana e anti-inflamatória suave",
  "enxofre": "Antibacteriano e queratolítico — eficaz para acne e oleosidade excessiva",

  // ── Esfoliantes ───────────────────────────────────────────────────────────
  "acido glicolico": "AHA de menor peso molecular — renova células e melhora textura e luminosidade",
  "acido lactico": "AHA suave com ação hidratante — esfoliação com menor irritação",
  "acido mandélico": "AHA derivado de amêndoas — esfoliação gentil ideal para peles sensíveis",
  "acido fítico": "Antioxidante e quelante — esfoliação suave com ação antimanchas",
  "pha": "Poli-hidroxi ácido — renovação celular ultrassuave para pele sensível ou reativa",

  // ── Calmantes / Anti-inflamatórios ────────────────────────────────────────
  "extrato de camomila": "Calmante e anti-inflamatório — ideal para pele sensível ou com vermelhidão",
  "centella asiatica": "Acelera a cicatrização, reduz vermelhidão e fortalece a barreira — ideal para pele sensível",
  "alantoina": "Suaviza e regenera a pele irritada, com ação queratoplástica",
  "extrato de chá verde": "Rico em EGCG — antioxidante, anti-inflamatório e protege contra danos UV",
  "bisabolol": "Derivado da camomila — calmante, anti-irritante e facilita a penetração de outros ativos",

  // ── Proteção solar ────────────────────────────────────────────────────────
  "fps50+": "Proteção UVA/UVB de alta eficácia — essencial diariamente para prevenir fotodano",
  "fps30": "Proteção solar mínima recomendada para uso diário — reaplicar a cada 2h ao ar livre",
  "dioxido de titanio": "Filtro mineral físico — bloqueia UV por reflexão, ideal para pele sensível",
  "dioxido de titanio 5%": "Filtro mineral físico — ideal para pele sensível e reativa",
  "oxido de zinco": "Filtro mineral de amplo espectro — anti-inflamatório e suave na pele",
  "avobenzona 3%": "Filtro químico de amplo espectro para UVA — eficaz e estável com avobenzona",
  "octinoxato": "Filtro UVB eficaz — complementa a proteção do filtro UVA",
  "tinosorb m": "Filtro misto de último geração — estável, amplo espectro e resistente à água",
};

/**
 * Retorna o benefício de um ativo — busca insensível a maiúsculas/acentos.
 * Retorna `undefined` se o ativo não estiver no mapa.
 */
export function getBeneficio(ativo: string): string | undefined {
  const key = ativo.toLowerCase().trim();
  // Busca direta
  if (key in ATIVOS_BENEFICIOS) return ATIVOS_BENEFICIOS[key];
  // Busca no original (para casos sem normalização)
  if (ativo in ATIVOS_BENEFICIOS) return ATIVOS_BENEFICIOS[ativo];
  // Busca parcial — se o ativo contém uma chave conhecida (ex: "niacinamida 4%" → niacinamida)
  for (const mapKey of Object.keys(ATIVOS_BENEFICIOS)) {
    if (key.startsWith(mapKey) || mapKey.startsWith(key)) {
      return ATIVOS_BENEFICIOS[mapKey];
    }
  }
  return undefined;
}
