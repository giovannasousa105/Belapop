import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Svg,
  Path,
  Ellipse,
  Rect,
  Line,
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
} from "@react-pdf/renderer";

import path from "path";

import type { SkinAnalysisSession } from "@/lib/skincare/skinAnalysis";

// ─── Fonts ───────────────────────────────────────────────────────────────────
// Bundladas localmente (não buscar via URL em runtime — gstatic muda hashes de
// versão e quebra silenciosamente em produção serverless).
const FONTS_DIR = path.join(process.cwd(), "lib/skin-scan/fonts");

Font.register({
  family: "Playfair",
  fonts: [
    { src: path.join(FONTS_DIR, "PlayfairDisplay-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS_DIR, "PlayfairDisplay-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(FONTS_DIR, "Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS_DIR, "Inter-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(FONTS_DIR, "Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:       "#F5EFE6",
  rose:     "#C4846B",
  roseDark: "#9A6050",
  dk:       "#1A1A1A",
  d2:       "#2C2C2C",
  mid:      "#6B6B6B",
  acc:      "#8B6F77",
  bdr:      "#E0D5CC",
  wh:       "#FFFFFF",
  gr:       "#7BAF9E",
  barBg:    "#EBE3DC",
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    fontFamily: "Inter",
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: C.dk,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontFamily: "Playfair",
    fontSize: 18,
    fontWeight: 700,
    color: C.wh,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  brandSub: {
    fontFamily: "Inter",
    fontSize: 6,
    color: "#C4A882",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  reportLabel: {
    fontSize: 6,
    color: "#C4A882",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "right",
  },
  reportDate: {
    fontSize: 6,
    color: "#C4A882",
    marginTop: 2,
    textAlign: "right",
  },

  // Content wrapper
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  // Banner
  banner: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: C.rose,
  },
  bannerTitle: {
    fontFamily: "Playfair",
    fontSize: 13,
    fontWeight: 700,
    color: C.wh,
  },
  bannerSub: {
    fontSize: 6.5,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
    maxWidth: 280,
  },
  bannerPill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  bannerPillText: {
    fontSize: 9,
    fontWeight: 700,
    color: C.wh,
  },

  // Card
  card: {
    backgroundColor: C.wh,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.bdr,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    color: C.acc,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    paddingBottom: 6,
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.bdr,
  },

  // Main grid
  grid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  leftCol: {
    width: 168,
  },
  rightCol: {
    flex: 1,
    gap: 8,
  },

  // Score rows
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 7,
    fontWeight: 500,
    color: C.d2,
    width: 62,
  },
  scoreBarWrap: {
    flex: 1,
    height: 4,
    backgroundColor: C.barBg,
    borderRadius: 4,
  },
  scoreBar: {
    height: 4,
    borderRadius: 4,
  },
  scoreVal: {
    fontSize: 7,
    fontWeight: 700,
    color: C.mid,
    width: 24,
    textAlign: "right",
  },

  // Focos pills
  pill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.rose,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FFF0EA",
    marginRight: 4,
    marginBottom: 4,
  },
  pillText: {
    fontSize: 7,
    fontWeight: 700,
    color: C.rose,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },

  // Achados grid
  achadosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  achadoItem: {
    width: "50%",
    marginBottom: 4,
  },
  achadoLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: C.d2,
  },
  achadoVal: {
    fontSize: 7,
    color: C.mid,
  },
  achadoAlerta: {
    fontSize: 7,
    fontWeight: 700,
    color: C.rose,
  },

  // Fitzpatrick
  fitzRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  fitzSwatches: {
    flexDirection: "row",
    gap: 4,
  },
  fitzSwatch: {
    alignItems: "center",
    gap: 2,
  },
  fitzCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  fitzNum: {
    fontSize: 6,
    color: C.mid,
  },
  fitzInfo: {
    flex: 1,
  },
  fitzTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: C.d2,
    marginBottom: 3,
  },
  fitzDesc: {
    fontSize: 7,
    color: C.mid,
    lineHeight: 1.5,
  },
  fitzTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 5,
  },
  fitzTag: {
    fontSize: 6.5,
    fontWeight: 700,
    color: C.acc,
    backgroundColor: "#F9F4F0",
    borderWidth: 1,
    borderColor: C.bdr,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  // Ativos
  ativosPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  ativoPill: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.acc,
    backgroundColor: "#F2EDF5",
    borderWidth: 1,
    borderColor: "#C0B0C8",
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },

  // Rotina
  rotinaGrid: {
    flexDirection: "row",
    gap: 8,
  },
  rotinaCol: {
    flex: 1,
  },
  rotinaPeriodTitle: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  stepCard: {
    backgroundColor: C.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.bdr,
    padding: 7,
    marginBottom: 5,
  },
  stepNum: {
    fontSize: 6,
    fontWeight: 700,
    color: C.acc,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  stepName: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.d2,
    lineHeight: 1.3,
  },
  stepPrice: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.rose,
    marginTop: 2,
  },
  stepTip: {
    fontSize: 6,
    color: C.mid,
    marginTop: 2,
    fontStyle: "italic",
  },
  rotinaNoite: {
    backgroundColor: C.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.bdr,
    padding: 8,
    flex: 1,
  },
  rotinaNoiteText: {
    fontSize: 7,
    color: C.mid,
    lineHeight: 1.6,
  },

  // Map legend
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 7,
    fontWeight: 500,
    color: C.d2,
  },
  legendVal: {
    fontSize: 6.5,
    color: C.mid,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.dk,
    paddingHorizontal: 20,
    paddingVertical: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6,
    color: "#666",
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number | null): string {
  if (cents == null) return "–";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function mapConcernLabel(concern: string): string {
  const m: Record<string, string> = {
    hydration: "Hidratação",
    uniformity: "Uniformidade",
    oiliness: "Oleosidade",
    sensitivity: "Sensibilidade",
    texture: "Textura",
    luminosity: "Luminosidade",
    pores: "Poros",
    fine_lines: "Linhas finas",
    redness: "Vermelhidão",
    acne: "Acne",
  };
  return m[concern] ?? concern;
}

function tipoPeleFromAnalysis(session: SkinAnalysisSession): string {
  if (session.scienceRoutine?.skinProfile) return session.scienceRoutine.skinProfile;
  const oily = session.analysis.oilinessAppearance.label.toLowerCase();
  const dry  = session.analysis.drynessAppearance.label.toLowerCase();
  if (oily.includes("alta") || oily.includes("elevada")) return "Oleosa";
  if (dry.includes("alta") || dry.includes("elevada"))  return "Seca";
  if (oily.includes("moderada") && dry.includes("leve")) return "Mista";
  return "Normal/Equilibrada";
}

function scoreFromLabel(label: string): { pct: number; display: string } {
  const l = label.toLowerCase();
  if (l.includes("baixa") || l.includes("baixo") || l.includes("leve") || l.includes("não aparente"))
    return { pct: 25, display: "Baixa" };
  if (l.includes("equilibrada") || l.includes("regular") || l.includes("normal") || l.includes("lisa"))
    return { pct: 60, display: "Moderada" };
  if (l.includes("alta") || l.includes("elevada") || l.includes("presente") || l.includes("dilatad"))
    return { pct: 80, display: "Alta" };
  return { pct: 50, display: label };
}

function fitzparickFromSkinType(tipoPele: string): number {
  if (tipoPele.toLowerCase().includes("mista")) return 3;
  if (tipoPele.toLowerCase().includes("oleosa")) return 3;
  if (tipoPele.toLowerCase().includes("seca")) return 2;
  return 3;
}

const FITZ_COLORS = ["#FDE8D0", "#F5C9A0", "#E8B080", "#C8845A", "#8B5A38", "#4A2C18"];

// ─── SVG Face ────────────────────────────────────────────────────────────────
function FaceMapSvg() {
  return (
    <Svg width={150} viewBox="0 0 240 310">
      <Defs>
        <RadialGradient id="sk" cx="48%" cy="28%" r="68%">
          <Stop offset="0%"   stopColor="#FDEBD8" />
          <Stop offset="45%"  stopColor="#F0CFB0" />
          <Stop offset="82%"  stopColor="#E0B890" />
          <Stop offset="100%" stopColor="#C8A070" />
        </RadialGradient>
        <LinearGradient id="ztG" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#D4956A" stopOpacity={0.4} />
          <Stop offset="70%"  stopColor="#D4956A" stopOpacity={0.16} />
          <Stop offset="100%" stopColor="#D4956A" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="lU" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#C07278" />
          <Stop offset="100%" stopColor="#A05060" />
        </LinearGradient>
        <LinearGradient id="lL" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#D08888" />
          <Stop offset="65%"  stopColor="#BC7070" />
          <Stop offset="100%" stopColor="#A85A60" />
        </LinearGradient>
      </Defs>

      {/* Cabelo */}
      <Ellipse cx={120} cy={46} rx={80} ry={58} fill="#1C100A" />
      <Path d="M42,92 Q36,46 60,20 Q84,-4 120,-2 Q156,-4 180,20 Q204,46 198,92 Q182,58 162,42 Q142,28 120,26 Q98,28 78,42 Q58,58 42,92Z" fill="#1C100A" />

      {/* Orelhas */}
      <Path d="M46,122 Q32,122 30,138 Q28,156 35,166 Q41,174 50,170 Q46,160 46,146 Q46,132 50,124Z" fill="#E8C09A" />
      <Path d="M194,122 Q208,122 210,138 Q212,156 205,166 Q199,174 190,170 Q194,160 194,146 Q194,132 190,124Z" fill="#E8C09A" />

      {/* Pescoço */}
      <Path d="M90,288 Q88,308 120,310 Q152,308 150,288 L150,260 Q149,248 120,248 Q91,248 90,260Z" fill="#E8C09A" />

      {/* Rosto base */}
      <Path d="M50,106 Q44,62 66,37 Q90,11 120,9 Q150,11 174,37 Q196,62 190,106 L188,178 Q184,222 162,244 Q144,260 120,262 Q96,260 78,244 Q56,222 52,178Z" fill="url(#sk)" />

      {/* Zona T */}
      <Ellipse cx={120} cy={68} rx={54} ry={42} fill="url(#ztG)" />
      <Rect x={112} y={102} width={16} height={82} rx={8} fill="#D4956A" fillOpacity={0.12} />

      {/* Bochechas */}
      <Ellipse cx={72}  cy={166} rx={32} ry={25} fill="#C4A882" fillOpacity={0.15} />
      <Ellipse cx={168} cy={166} rx={32} ry={25} fill="#C4A882" fillOpacity={0.15} />

      {/* Sobrancelhas */}
      <Path d="M59,92 Q76,80 98,84" stroke="#1E0E06" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <Path d="M142,84 Q164,80 181,92" stroke="#1E0E06" strokeWidth={4.5} fill="none" strokeLinecap="round" />

      {/* Olho esquerdo */}
      <Path d="M58,106 Q79,96 100,106 Q79,116 58,106Z" fill="#F6F0E8" />
      <Ellipse cx={79} cy={106} rx={11} ry={10.5} fill="#5C3A1E" />
      <Ellipse cx={79} cy={106} rx={5.8} ry={6}    fill="#080402" />
      <Ellipse cx={74} cy={102} rx={3}   ry={2.2}  fill="#fff" fillOpacity={0.92} />
      <Path d="M58,106 Q79,94 100,106" stroke="#180A04" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {/* Cílios esq */}
      {[60,65,71,79,87,93,98].map((x, i) => (
        <Line key={i} x1={x} y1={104} x2={x + (x < 79 ? -3 : x === 79 ? 0 : 2)} y2={98} stroke="#0E0602" strokeWidth={1.3} strokeLinecap="round" />
      ))}

      {/* Olho direito */}
      <Path d="M140,106 Q161,96 182,106 Q161,116 140,106Z" fill="#F6F0E8" />
      <Ellipse cx={161} cy={106} rx={11} ry={10.5} fill="#5C3A1E" />
      <Ellipse cx={161} cy={106} rx={5.8} ry={6}   fill="#080402" />
      <Ellipse cx={156} cy={102} rx={3}   ry={2.2} fill="#fff" fillOpacity={0.92} />
      <Path d="M140,106 Q161,94 182,106" stroke="#180A04" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {/* Cílios dir */}
      {[142,147,153,161,169,175,180].map((x, i) => (
        <Line key={i} x1={x} y1={104} x2={x + (x < 161 ? -3 : x === 161 ? 0 : 2)} y2={98} stroke="#0E0602" strokeWidth={1.3} strokeLinecap="round" />
      ))}

      {/* Nariz */}
      <Path d="M116,118 Q112,144 110,160 Q114,172 120,174 Q126,172 130,160 Q128,144 124,118Z" fill="#E8B880" fillOpacity={0.35} />
      <Path d="M106,158 Q96,163 96,173 Q101,181 112,178 Q108,170 108,162Z" fill="#D0A070" fillOpacity={0.46} />
      <Path d="M134,158 Q144,163 144,173 Q139,181 128,178 Q132,170 132,162Z" fill="#D0A070" fillOpacity={0.46} />

      {/* Boca */}
      <Path d="M93,204 Q102,194 112,196 Q120,194 128,196 Q138,194 147,204 Q138,211 120,210 Q102,211 93,204Z" fill="url(#lU)" />
      <Path d="M93,204 Q102,222 120,224 Q138,222 147,204 Q138,211 120,210 Q102,211 93,204Z" fill="url(#lL)" />
      <Path d="M93,204 Q120,210 147,204" stroke="#883848" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      <Ellipse cx={120} cy={215} rx={16} ry={5} fill="#fff" fillOpacity={0.1} />

      {/* Mancha hiperpigmentada */}
      <Ellipse cx={152} cy={148} rx={7} ry={5.5} fill="#6A3C18" fillOpacity={0.38} />
      <Ellipse cx={77}  cy={158} rx={5.5} ry={4.5} fill="#6A3C18" fillOpacity={0.32} />
    </Svg>
  );
}

// ─── Score Bar component ──────────────────────────────────────────────────────
function ScoreBar({ label, pct, color, display }: { label: string; pct: number; color: string; display: string }) {
  return (
    <View style={s.scoreRow}>
      <Text style={s.scoreLabel}>{label}</Text>
      <View style={s.scoreBarWrap}>
        <View style={[s.scoreBar, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.scoreVal}>{Math.round(pct / 10)}/10</Text>
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────
export function SkinScanReportPdf({ session, generatedAt }: { session: SkinAnalysisSession; generatedAt: string }) {
  const a         = session.analysis;
  const routine   = session.scienceRoutine;
  const products  = session.recommendedProducts;
  const tipoPele  = tipoPeleFromAnalysis(session);
  const fitz      = fitzparickFromSkinType(tipoPele);
  const dateStr   = new Date(generatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const hidratacao   = scoreFromLabel(a.drynessAppearance.label);
  const oleosidade   = scoreFromLabel(a.oilinessAppearance.label);
  const uniformidade = { pct: a.toneUniformity.score, display: a.toneUniformity.label };
  const textura      = { pct: a.skinTexture.score,    display: a.skinTexture.label };
  const luminosidade = { pct: Math.round((a.toneUniformity.score + a.skinTexture.score) / 2), display: "Estimada" };
  const sensibilidade = scoreFromLabel(a.rednessAppearance.label);

  const ativos: string[] = routine?.topActives.length
    ? routine.topActives
    : ["Niacinamida", "Glicerina 3%", "FPS50+", "Ácido Hialurônico"];

  const focos = a.topConcerns.map(mapConcernLabel);

  const fitzTitle = [
    "Tipo I — Muito Clara",
    "Tipo II — Clara",
    "Tipo III — Clara a Morena Clara",
    "Tipo IV — Morena Moderada",
    "Tipo V — Morena Escura",
    "Tipo VI — Muito Escura / Negra",
  ][fitz - 1] ?? "Tipo III";

  const rotinaPassos = routine?.manha.length
    ? routine.manha.slice(0, 2)
    : products.slice(0, 2).map((p, i) => ({
        step: i + 1,
        name: p.name,
        price: p.priceCents,
        ritual: "Aplicar em movimentos suaves",
      }));

  return (
    <Document title="Relatório Skin Scan BelaPop" author="BelaPop">
      <Page size="A4" style={s.page}>

        {/* ① HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>BelaPop</Text>
            <Text style={s.brandSub}>Skincare Curado com Inteligência</Text>
          </View>
          <View>
            <Text style={s.reportLabel}>✦ Relatório Skin Scan</Text>
            <Text style={s.reportDate}>{dateStr}</Text>
          </View>
        </View>

        <View style={s.content}>

          {/* ② BANNER */}
          <View style={s.banner}>
            <View>
              <Text style={s.bannerTitle}>Sua Análise de Pele</Text>
              <Text style={s.bannerSub}>
                Baseada em evidências PubMed · AAD 2024 · Orientativa — não substitui avaliação dermatológica
              </Text>
            </View>
            <View style={s.bannerPill}>
              <Text style={s.bannerPillText}>{tipoPele}</Text>
            </View>
          </View>

          {/* ③ GRID PRINCIPAL */}
          <View style={s.grid}>

            {/* ③-A MAPA */}
            <View style={[s.card, s.leftCol]}>
              <Text style={s.cardTitle}>Mapa de Zonas da Pele</Text>
              <View style={{ alignItems: "center" }}>
                <FaceMapSvg />
              </View>
              {/* Legenda */}
              <View style={{ marginTop: 6 }}>
                {[
                  { color: "#D4956A", name: "Zona T",    val: "Mista" },
                  { color: "#C4A882", name: "Bochechas",  val: "Normais" },
                  { color: "#6A3C18", name: "Manchas",    val: "Hiperpigm." },
                  { color: "#A89080", name: "Poros",      val: a.visiblePores.label },
                ].map((item) => (
                  <View key={item.name} style={s.legendRow}>
                    <View style={s.legendLeft}>
                      <View style={[s.legendDot, { backgroundColor: item.color }]} />
                      <Text style={s.legendName}>{item.name}</Text>
                    </View>
                    <Text style={s.legendVal}>{item.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ③-B SCORES + FOCOS */}
            <View style={s.rightCol}>

              {/* Scores */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Scores Visuais</Text>
                <ScoreBar label="Hidratação"   pct={100 - hidratacao.pct}   color={C.rose}  display={hidratacao.display} />
                <ScoreBar label="Oleosidade"   pct={oleosidade.pct}          color={C.acc}   display={oleosidade.display} />
                <ScoreBar label="Uniformidade" pct={uniformidade.pct}        color={C.rose}  display={uniformidade.display} />
                <ScoreBar label="Textura"      pct={textura.pct}             color={C.acc}   display={textura.display} />
                <ScoreBar label="Luminosidade" pct={luminosidade.pct}        color={C.rose}  display={luminosidade.display} />
                <ScoreBar label="Sensibilidade" pct={sensibilidade.pct}      color={C.gr}    display={sensibilidade.display} />
              </View>

              {/* Focos & Achados */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Focos & Achados</Text>
                <View style={s.pillsRow}>
                  {focos.map((f) => (
                    <View key={f} style={s.pill}>
                      <Text style={s.pillText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.achadosGrid}>
                  {[
                    ["Zona T",       a.oilinessAppearance.zones.length ? "Oleosa" : "Mista", false],
                    ["Bochechas",    a.drynessAppearance.zones.length ? "Ressecadas" : "Normais", false],
                    ["Vermelhidão",  a.rednessAppearance.label, a.rednessAppearance.label.toLowerCase().includes("alta")],
                    ["Poros",        a.visiblePores.label, false],
                    ["Linhas finas", a.fineLinesAppearance.label, false],
                    ["Textura",      a.skinTexture.label, false],
                  ].map(([lbl, val, alert]) => (
                    <View key={String(lbl)} style={s.achadoItem}>
                      <Text style={s.achadoLabel}>{String(lbl)}: </Text>
                      <Text style={alert ? s.achadoAlerta : s.achadoVal}>{String(val)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ④ FITZPATRICK */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Fototipo Fitzpatrick</Text>
            <View style={s.fitzRow}>
              <View style={s.fitzSwatches}>
                {FITZ_COLORS.map((color, i) => (
                  <View key={i} style={s.fitzSwatch}>
                    <View style={[
                      s.fitzCircle,
                      { backgroundColor: color },
                      i + 1 === fitz ? { borderWidth: 2, borderColor: C.rose } : {},
                    ]} />
                    <Text style={s.fitzNum}>{["I","II","III","IV","V","VI"][i]}</Text>
                  </View>
                ))}
              </View>
              <View style={s.fitzInfo}>
                <Text style={s.fitzTitle}>{fitzTitle}</Text>
                <Text style={s.fitzDesc}>
                  FPS diário é indispensável para prevenção de manchas e fotoenvelhecimento. Sensibilidade ao sol aumenta o risco de hiperpigmentação pós-inflamatória.
                </Text>
                <View style={s.fitzTags}>
                  {["FPS 50+ obrigatório", "Reaplicar a cada 2h", "Niacinamida para manchas"].map((tag) => (
                    <Text key={tag} style={s.fitzTag}>{tag}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ⑤ ATIVOS */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Ativos Prioritários · Base Científica (Grau A — PubMed · AAD 2024)</Text>
            <View style={s.ativosPills}>
              {ativos.map((a) => (
                <Text key={a} style={s.ativoPill}>{a}</Text>
              ))}
            </View>
          </View>

          {/* ⑥ ROTINA */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Rotina Personalizada</Text>
            <View style={s.rotinaGrid}>
              <View style={s.rotinaCol}>
                <Text style={[s.rotinaPeriodTitle, { color: C.rose }]}>☀ Manhã</Text>
                {rotinaPassos.map((passo, i) => (
                  <View key={i} style={s.stepCard}>
                    <Text style={s.stepNum}>Passo {i + 1}</Text>
                    <Text style={s.stepName}>
                      {"name" in passo ? String(passo.name) : ""}
                    </Text>
                    {"price" in passo && passo.price != null ? (
                      <Text style={s.stepPrice}>
                        {typeof passo.price === "number" && passo.price > 1000
                          ? formatCurrency(passo.price)
                          : `R$ ${Number(passo.price).toFixed(2).replace(".", ",")}`}
                      </Text>
                    ) : null}
                    {"ritual" in passo ? (
                      <Text style={s.stepTip}>{String(passo.ritual)}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
              <View style={s.rotinaCol}>
                <Text style={[s.rotinaPeriodTitle, { color: C.acc }]}>🌙 Noite & Semanal</Text>
                <View style={s.rotinaNoite}>
                  <Text style={s.rotinaNoiteText}>
                    Rotina noturna e tratamentos semanais personalizados disponíveis em belapopoficial.com.br
                  </Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* ⑦ FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            ⚠ Análise orientativa · não substitui avaliação dermatológica presencial · imagem deletada após análise
          </Text>
          <Text style={s.footerText}>belapopoficial.com.br · Skin Scan BelaPop</Text>
        </View>

      </Page>
    </Document>
  );
}
