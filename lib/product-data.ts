export interface ProductAtivo {
  nome: string;
  concentracao: string;
  funcao: string;
  referencia: string;
}

export interface ProductComoUsar {
  periodo: string;
  passos: string[];
}

export interface ProductDetails {
  descricao: string;
  subtitulo: string;
  ativos: ProductAtivo[];
  indicadoPara: string[];
  naoIndicadoPara: string[];
  comoUsar: ProductComoUsar[];
  textura: string;
  fragrancia: string;
  categoria: string;
  tags: string[];
}

export const PRODUCT_DETAILS: Record<string, ProductDetails> = {
  "gel-limpeza-veludo": {
    descricao:
      "Gel de limpeza facial com textura aveludada que remove impurezas, excesso de sebo e maquiagem leve sem agredir a barreira cutanea. Formula com surfactantes suaves que respeita o pH fisiologico da pele (4.5-5.5).",
    subtitulo: "Limpeza inteligente que respeita a barreira.",
    ativos: [
      {
        nome: "Glucosideo de Decil (surfactante suave)",
        concentracao: "~5%",
        funcao:
          "Limpeza eficaz com minima perturbacao do microbioma cutaneo",
        referencia: "PMID: 23528374",
      },
      {
        nome: "Glicerina",
        concentracao: "3-5%",
        funcao:
          "Humectante — mantem hidratacao durante a limpeza, reduz ressecamento pos-uso",
        referencia: "PMID: 19379639",
      },
      {
        nome: "Pantenol (Pro-Vitamina B5)",
        concentracao: "1%",
        funcao:
          "Cicatrizante suave, anti-inflamatorio, melhora maciez imediata",
        referencia: "PMID: 22606818",
      },
    ],
    indicadoPara: [
      "pele oleosa",
      "pele mista",
      "pele com acne",
      "pele normal",
      "uso diario manha e noite",
    ],
    naoIndicadoPara: [
      "remover maquiagem a prova d'agua (usar oleo de limpeza antes)",
      "pele com eczema severo (consulte dermatologista)",
    ],
    comoUsar: [
      {
        periodo: "MANHA — Reset Delicado",
        passos: [
          "Umedeca o rosto com agua fria ou morna",
          "Aplique uma pequena quantidade e massageie em movimentos circulares por 60 segundos",
          "Enxague bem com agua fria",
          "Siga com tonico ou serum",
        ],
      },
      {
        periodo: "NOITE — Limpeza Dupla",
        passos: [
          "Se usou protetor solar ou maquiagem, use um oleo/balsamo antes",
          "Aplique o Gel Veludo e massageie por 60-90 segundos",
          "Enxague com agua morna",
          "Continue com o serum noturno",
        ],
      },
    ],
    textura: "Gel transparente leve, sem espuma excessiva",
    fragrancia: "Fragrancia suave, dermatologicamente testada",
    categoria: "Limpeza",
    tags: ["limpeza", "gel", "pele oleosa", "pele mista", "surfactante suave", "sem sulfato SLS"],
  },

  "tonico-nuvem-de-rosa": {
    descricao:
      "Tonico facial aquoso com agua de rosas, acido hialuronico de multiplos pesos moleculares e extrato de camomila. Equilibra o pH apos a limpeza, prepara a pele para absorcao dos proximos ativos e entrega hidratacao imediata.",
    subtitulo: "O segundo passo que multiplica os outros.",
    ativos: [
      {
        nome: "Agua de Rosas Rosa Damascena",
        concentracao: "~30%",
        funcao:
          "Antioxidante, anti-inflamatoria leve, aroma aromaterapico comprovado",
        referencia: "PMID: 26151005",
      },
      {
        nome: "Acido Hialuronico (2 pesos moleculares)",
        concentracao: "0.5%",
        funcao:
          "Alto PM: forma filme hidratante | Baixo PM: penetra e estimula AH endogeno",
        referencia: "PMID: 22956862",
      },
      {
        nome: "Extrato de Camomila (Bisabolol)",
        concentracao: "0.2%",
        funcao: "Anti-inflamatorio suave, reduz eritema, acalma pele reativa",
        referencia: "PMID: 23614218",
      },
      {
        nome: "Niacinamida",
        concentracao: "2%",
        funcao: "Reforca ceramidas, minimiza poros, uniformiza",
        referencia: "PMID: 11984519",
      },
    ],
    indicadoPara: [
      "todos os tipos de pele",
      "pele sensivel",
      "pele desidratada",
      "como preparacao para serum e creme",
    ],
    naoIndicadoPara: [
      "uso isolado como hidratante principal (use junto com creme)",
    ],
    comoUsar: [
      {
        periodo: "MANHA E NOITE",
        passos: [
          "Apos limpeza, aplique com as palmas das maos ou algodao suave",
          "Passe suavemente do centro para as laterais do rosto",
          "Nao enxague — deixe absorver por 30 segundos",
          "Aplique o serum ou creme em seguida (pele ainda levemente umida)",
        ],
      },
    ],
    textura: "Agua levissima, sem alcool, absorcao imediata",
    fragrancia: "Rosa natural, muito suave",
    categoria: "Tonico",
    tags: ["tonico", "agua de rosas", "hidratacao", "pele sensivel", "sem alcool", "preparo"],
  },

  "serum-radiance-01": {
    descricao:
      "Serum noturno de alta concentracao com niacinamida 5%, vitamina C estabilizada e acido hialuronico. Formulado para uniformizar tom de pele, reduzir manchas e estimular a renovacao celular durante o sono — quando a pele esta 25% mais receptiva a ativos.",
    subtitulo: "O trabalho acontece enquanto voce dorme.",
    ativos: [
      {
        nome: "Niacinamida",
        concentracao: "5%",
        funcao:
          "Inibe transferencia de melanossomas em 35-68% (Hakozaki 2002), minimiza poros, controla oleosidade, reforca barreira",
        referencia: "PMID: 11984519",
      },
      {
        nome: "Vitamina C Estabilizada (Ascorbyl Glucoside)",
        concentracao: "3%",
        funcao:
          "Inibe tirosinase, neutraliza radicais livres, co-fator sintese de colageno — forma estabilizada sem oxidacao",
        referencia: "PMID: 32563278",
      },
      {
        nome: "Acido Hialuronico (multi-peso)",
        concentracao: "1%",
        funcao: "Hidratacao profunda em multiplas camadas da epiderme",
        referencia: "PMID: 22956862",
      },
      {
        nome: "Extrato de Licorice (Glabridina)",
        concentracao: "0.5%",
        funcao:
          "Inibidor de tirosinase potente, despigmentante natural, anti-inflamatorio",
        referencia: "PMID: 19438905",
      },
    ],
    indicadoPara: [
      "manchas",
      "hiperpigmentacao",
      "oleosidade",
      "pele com acne leve",
      "poros dilatados",
      "pele mista a oleosa",
    ],
    naoIndicadoPara: [
      "pele extremamente seca sem hidratante sequencial",
      "gestantes (verificar com medico)",
    ],
    comoUsar: [
      {
        periodo: "RITUAL NOTURNO",
        passos: [
          "Apos limpeza e tonico, com pele levemente umida",
          "Aplique 3-4 gotas e distribua pressionando suavemente (nao esfregar)",
          "Aguarde 60 segundos para absorcao",
          "Finalize com creme hidratante para selar os ativos",
        ],
      },
      {
        periodo: "DICA AVANCADA",
        passos: [
          "2x/semana, use como mascara tratante: aplique camada generosa, aguarde 10 min, remova o excesso com algodao",
        ],
      },
    ],
    textura: "Serum aquoso, fluido, sem oleosidade",
    fragrancia: "Sem fragrancia adicionada",
    categoria: "Serum",
    tags: ["serum", "niacinamida", "vitamina c", "manchas", "oleosidade", "noturno", "hiperpigmentacao"],
  },

  "creme-barrier-celeste": {
    descricao:
      "Creme hidratante diurno com complexo de ceramidas, esqualano vegetal e acido hialuronico. Reforca a barreira cutanea, entrega hidratacao de 24h e acabamento luminoso sem peso. Formulado para uso sob protetor solar.",
    subtitulo: "Barreira forte, pele que dura o dia inteiro.",
    ativos: [
      {
        nome: "Ceramida NP + AP + EOP (Complexo Ceramide)",
        concentracao: "2%",
        funcao:
          "Restaura lipidios intercelulares da barreira — reduz TEWL em ate 43% (Del Rosso 2016)",
        referencia: "PMID: 27617749",
      },
      {
        nome: "Esqualano Vegetal (azeitona)",
        concentracao: "3%",
        funcao:
          "Oclusivo leve, nao comedogenico, mimetiza sebo saudavel, suaviza textura",
        referencia: "PMID: 22279374",
      },
      {
        nome: "Acido Hialuronico (alto PM)",
        concentracao: "0.5%",
        funcao:
          "Forma filme hidratante na superficie, previne evaporacao",
        referencia: "PMID: 22956862",
      },
      {
        nome: "Pantenol",
        concentracao: "2%",
        funcao: "Suavizante, cicatrizante suave, aumenta elasticidade",
        referencia: "PMID: 22606818",
      },
    ],
    indicadoPara: [
      "pele seca",
      "pele sensivel",
      "pele normal",
      "uso matinal sob protetor",
      "pos-procedimento estetico",
    ],
    naoIndicadoPara: [
      "pele muito oleosa sem uso de acido salicilico antes",
      "uso noturno (pele oleosa) — prefira serum",
    ],
    comoUsar: [
      {
        periodo: "PRESENCA DIURNA",
        passos: [
          "Apos serum ou tonico, com pele ainda levemente umida",
          "Aplique em camada uniforme por todo o rosto e pescoco",
          "Aguarde 60 segundos antes do protetor solar",
          "E o penultimo passo da rotina matinal",
        ],
      },
    ],
    textura: "Creme leve, nao gorduroso, finalizamento mate-luminoso",
    fragrancia: "Fragrancia suave, dermatologicamente testada",
    categoria: "Hidratante",
    tags: ["hidratante", "ceramidas", "barreira", "pele seca", "pele sensivel", "diurno"],
  },

  "protetor-solar-luz-de-vela-fps50": {
    descricao:
      "Protetor solar facial FPS 50+ com PPD 19 (protecao UVA), formula fluida de acabamento luminoso. Filtros organicos + inorganicos em combinacao para cobertura total UVA/UVB. Dermatologicamente testado, sem alcool.",
    subtitulo: "O unico anti-aging com evidencia Cochrane Grau 1A.",
    ativos: [
      {
        nome: "Tinosorb M + Tinosorb S (UVB + UVA)",
        concentracao: "~10% combinado",
        funcao:
          "Protecao de amplo espectro, fotostavel, nao produz radicais livres (superior a avobenzona)",
        referencia: "PMID: 27474275",
      },
      {
        nome: "Oxido de Zinco (nano)",
        concentracao: "5%",
        funcao:
          "Filtro fisico UVA/UVB, anti-inflamatorio, seguro para pele sensivel",
        referencia: "PMID: 29282145",
      },
      {
        nome: "Niacinamida",
        concentracao: "2%",
        funcao:
          "Antioxidante adicional, minimiza impacto de raios UV no colageno",
        referencia: "PMID: 11984519",
      },
    ],
    indicadoPara: [
      "TODOS os tipos de pele",
      "uso diario obrigatorio",
      "reaplique a cada 2h sob exposicao solar direta",
    ],
    naoIndicadoPara: [
      "substituto de creme hidratante (use os dois)",
    ],
    comoUsar: [
      {
        periodo: "ULTIMO PASSO DA MANHA (obrigatorio)",
        passos: [
          "Aplicar apos todos os outros produtos — SEMPRE o ultimo",
          "Quantidade: 1/4 colher de cha para o rosto (regra da 2mg/cm2)",
          "Distribuir uniformemente, incluindo pescoco e decollete",
          "Aguardar 5 minutos antes de maquiagem",
          "Reaplicar a cada 2h quando exposta ao sol",
        ],
      },
    ],
    textura: "Fluido levissimo, acabamento luminoso, toque seco",
    fragrancia: "Neutra, sem alcool",
    categoria: "Protecao Solar",
    tags: ["protetor solar", "fps50", "uvb", "uva", "ppd19", "anti-aging", "obrigatorio"],
  },

  "patch-olhos-aurora": {
    descricao:
      "Patches hidrogelados para a area periorbital com cafeina 3%, complexo de peptideos e acido hialuronico. Tratamento intensivo de 15-20 minutos que reduz olheiras vasculares, bolsas infra-orbitais e linhas finas da expressao.",
    subtitulo: "Quinze minutos. Resultado que voce ve.",
    ativos: [
      {
        nome: "Cafeina",
        concentracao: "3%",
        funcao:
          "Vasoconstritora — reduz eritema e dilatacao vascular (olheiras roxas/azuladas). Inibe PDE, lipolise local (bolsas)",
        referencia: "PMID: 32737095",
      },
      {
        nome: "Palmitoil Pentapeptideo-4 (Matrixyl)",
        concentracao: "3 ppm",
        funcao:
          "Ativa TGF-beta1, estimula colageno I/III/IV — preenche linhas finas periorbital",
        referencia: "PMID: 35638506",
      },
      {
        nome: "Acido Hialuronico (baixo PM)",
        concentracao: "1%",
        funcao:
          "Penetra e hidrata profundamente a pele fina da area dos olhos, efeito plumping",
        referencia: "PMID: 22956862",
      },
      {
        nome: "Extrato de Cha Branco",
        concentracao: "1%",
        funcao:
          "Antioxidante, neutraliza radicais livres que degradam colageno periorbital",
        referencia: "PMID: 19061451",
      },
    ],
    indicadoPara: [
      "olheiras",
      "bolsas infra-orbitais",
      "linhas finas ao redor dos olhos",
      "cansaco",
      "uso matinal antes de eventos",
    ],
    naoIndicadoPara: [
      "uso sobre pele com lesoes abertas",
      "pressao direta sobre o globo ocular",
    ],
    comoUsar: [
      {
        periodo: "TRATAMENTO INTENSIVO (manha)",
        passos: [
          "Limpe bem a area dos olhos",
          "Aplique os patches sobre as olheiras com a parte gel para baixo",
          "Deixe agir por 15-20 minutos (pode usar o tempo de cafe ou meditacao)",
          "Remova e massageie o excesso de essencia suavemente",
          "Aplique protetor solar por cima",
        ],
      },
      {
        periodo: "DICA PRO",
        passos: [
          "Guarde no refrigerador por 10 minutos antes de usar para efeito descongestionante amplificado",
          "Use 3x/semana para manutencao | 7x/semana em semanas de muito estresse",
        ],
      },
    ],
    textura: "Hidrogel de contato, fresco, nao escorrega",
    fragrancia: "Sem fragrancia",
    categoria: "Olhos",
    tags: ["olheiras", "patches", "cafeina", "peptideos", "area dos olhos", "hidrogel"],
  },
};

export const COMPLEMENTARY_PRODUCTS: Record<string, string[]> = {
  limpeza: ["tonico-nuvem-de-rosa", "serum-radiance-01", "protetor-solar-luz-de-vela-fps50"],
  tonico: ["gel-limpeza-veludo", "serum-radiance-01", "creme-barrier-celeste"],
  serum: ["gel-limpeza-veludo", "tonico-nuvem-de-rosa", "creme-barrier-celeste"],
  hidratante: ["gel-limpeza-veludo", "serum-radiance-01", "protetor-solar-luz-de-vela-fps50"],
  protecao: ["gel-limpeza-veludo", "serum-radiance-01", "creme-barrier-celeste"],
  olhos: ["gel-limpeza-veludo", "creme-barrier-celeste", "protetor-solar-luz-de-vela-fps50"],
};

export const PRODUCT_NAMES: Record<string, string> = {
  "gel-limpeza-veludo": "Gel Limpeza Veludo",
  "tonico-nuvem-de-rosa": "Tonico Nuvem de Rosa",
  "serum-radiance-01": "Serum Radiance 01",
  "creme-barrier-celeste": "Creme Barrier Celeste",
  "protetor-solar-luz-de-vela-fps50": "Protetor Solar Luz de Vela FPS 50",
  "patch-olhos-aurora": "Patch Olhos Aurora",
};
