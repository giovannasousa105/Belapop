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
import { getSkinTypeRecommendations } from "@/lib/skin-scan/evidence-by-skin-type";
import type { EvidenceGrade } from "@/lib/skin-scan/evidence-by-skin-type";

// ─── Fonts ───────────────────────────────────────────────────────────────────
const FONTS_DIR = path.join(process.cwd(), "lib/skin-scan/fonts");

Font.register({
  family: "Playfair",
  fonts: [
    { src: path.join(FONTS_DIR, "PlayfairDisplay-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS_DIR, "PlayfairDisplay-Bold.ttf"),    fontWeight: 700 },
  ],
});
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(FONTS_DIR, "Inter-Regular.ttf"),   fontWeight: 400 },
    { src: path.join(FONTS_DIR, "Inter-Italic.ttf"),    fontWeight: 400, fontStyle: "italic" },
    { src: path.join(FONTS_DIR, "Inter-SemiBold.ttf"),  fontWeight: 600 },
    { src: path.join(FONTS_DIR, "Inter-Bold.ttf"),      fontWeight: 700 },
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
  gradeA:   "#2D6A4F",
  gradeABg: "#D8F0E8",
  gradeB:   "#1D4E89",
  gradeBBg: "#D6E8F7",
  gradeC:   "#555",
  gradeCBg: "#EBEBEB",
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    fontFamily: "Inter",
    paddingBottom: 40,
  },
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
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
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

  // ── Evidências ──────────────────────────────────────────────────────────────
  evidenceHeadline: {
    fontSize: 7,
    color: C.mid,
    fontStyle: "italic",
    marginBottom: 8,
    lineHeight: 1.45,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 7,
    alignItems: "flex-start",
  },
  gradeBadge: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 36,
    alignItems: "center",
  },
  gradeBadgeText: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  evidenceBody: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.d2,
    marginBottom: 1,
  },
  evidenceBenefit: {
    fontSize: 6.5,
    color: C.mid,
    lineHeight: 1.4,
  },
  evidenceSource: {
    fontSize: 5.8,
    color: C.acc,
    fontStyle: "italic",
    marginTop: 1,
  },
  evidenceCaution: {
    fontSize: 5.8,
    color: "#B86040",
    marginTop: 1,
    fontStyle: "italic",
  },
  evidenceDivider: {
    height: 1,
    backgroundColor: C.bdr,
    marginVertical: 4,
  },
  tipsSection: {
    marginTop: 4,
  },
  tipsTitleText: {
    fontSize: 6,
    fontWeight: 700,
    color: C.acc,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 3,
    alignItems: "flex-start",
  },
  tipBullet: {
    fontSize: 6.5,
    color: C.rose,
    marginTop: 0.5,
  },
  tipText: {
    flex: 1,
    fontSize: 6.5,
    color: C.mid,
    lineHeight: 1.4,
  },

  // ── Rotina ──────────────────────────────────────────────────────────────────
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
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function mapConcernLabel(concern: string): string {
  const m: Record<string, string> = {
    hydration: "Hidratação", uniformity: "Uniformidade", oiliness: "Oleosidade",
    sensitivity: "Sensibilidade", texture: "Textura", luminosity: "Luminosidade",
    pores: "Poros", fine_lines: "Linhas finas", redness: "Vermelhidão", acne: "Acne",
  };
  return m[concern] ?? concern;
}

function tipoPeleFromAnalysis(session: SkinAnalysisSession): string {
  if (session.scienceRoutine?.skinProfile) return session.scienceRoutine.skinProfile;
  const oily = session.analysis.oilinessAppearance.label.toLowerCase();
  const dry  = session.analysis.drynessAppearance.label.toLowerCase();
  if (oily.includes("alta") || oily.includes("elevada")) return "Oleosa";
  if (dry.includes("alta")  || dry.includes("elevada"))  return "Seca";
  if (oily.includes("moderada")) return "Mista";
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
  if (tipoPele.toLowerCase().includes("mista"))  return 3;
  if (tipoPele.toLowerCase().includes("oleosa")) return 3;
  if (tipoPele.toLowerCase().includes("seca"))   return 2;
  return 3;
}

const FITZ_COLORS = ["#FDE8D0", "#F5C9A0", "#E8B080", "#C8845A", "#8B5A38", "#4A2C18"];

const GRADE_STYLES: Record<EvidenceGrade, { bg: string; color: string; label: string }> = {
  A: { bg: C.gradeABg, color: C.gradeA, label: "Grau A" },
  B: { bg: C.gradeBBg, color: C.gradeB, label: "Grau B" },
  C: { bg: C.gradeCBg, color: C.gradeC, label: "Grau C" },
};

// ─── SVG Face — Ilustração editorial premium ──────────────────────────────────
// Estética minimalista de beleza: traços finos, gradientes suaves, proporções
// harmônicas. Zonas refletem achados reais; manchas aparecem só se indicado.
function FaceMapSvg({
  highOiliness,
  showRedness,
  showSpots,
}: {
  highOiliness: boolean;
  showRedness: boolean;
  showSpots: boolean;
}) {
  return (
    <Svg width={150} viewBox="0 0 240 316">
      <Defs>
        {/* Pele — luminosa, com luz natural no centro */}
        <RadialGradient id="sk" cx="42%" cy="28%" r="68%">
          <Stop offset="0%"   stopColor="#FEF0E2" />
          <Stop offset="20%"  stopColor="#F8D8BC" />
          <Stop offset="54%"  stopColor="#EDBF98" />
          <Stop offset="100%" stopColor="#D8A07C" />
        </RadialGradient>
        {/* Zona T — dourado rosê muito suave */}
        <LinearGradient id="ztG" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#C8906A" stopOpacity={highOiliness ? 0.30 : 0.13} />
          <Stop offset="55%"  stopColor="#C8906A" stopOpacity={highOiliness ? 0.09 : 0.03} />
          <Stop offset="100%" stopColor="#C8906A" stopOpacity={0} />
        </LinearGradient>
        {/* Lábio superior — rosé médio quente */}
        <LinearGradient id="lU" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#CC9090" />
          <Stop offset="100%" stopColor="#AA6A6A" />
        </LinearGradient>
        {/* Lábio inferior — rosé mais claro e luminoso */}
        <LinearGradient id="lL" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#DCA8A0" />
          <Stop offset="55%"  stopColor="#C48880" />
          <Stop offset="100%" stopColor="#AA6A6A" />
        </LinearGradient>
      </Defs>

      {/* ── Cabelo — castanho escuro com volume e brilho ── */}
      <Ellipse cx={120} cy={42} rx={82} ry={62} fill="#1C0A06" />
      <Path
        d="M38,96 Q32,48 58,20 Q82,-6 120,-4 Q158,-6 182,20 Q208,48 202,96 Q186,58 164,40 Q144,26 120,24 Q96,26 76,40 Q54,58 38,96Z"
        fill="#1C0A06"
      />
      {/* Reflexo de luz no cabelo — mecha sutil */}
      <Path d="M94,27 Q102,21 110,25 Q106,31 98,33Z" fill="#3A1A0C" fillOpacity={0.55} />
      <Path d="M120,24 Q128,19 136,23 Q132,29 124,31Z" fill="#3A1A0C" fillOpacity={0.55} />

      {/* ── Orelhas com detalhe interno ── */}
      <Path d="M44,124 Q30,124 28,140 Q26,158 33,168 Q39,176 48,172 Q44,162 44,148 Q44,132 48,124Z" fill="#E4B898" />
      <Path d="M196,124 Q210,124 212,140 Q214,158 207,168 Q201,176 192,172 Q196,162 196,148 Q196,132 192,124Z" fill="#E4B898" />
      <Path d="M37,138 Q35,150 37,160 Q41,164 45,160 Q42,152 42,142Z" fill="#C89878" fillOpacity={0.28} />
      <Path d="M203,138 Q205,150 203,160 Q199,164 195,160 Q198,152 198,142Z" fill="#C89878" fillOpacity={0.28} />

      {/* ── Pescoço ── */}
      <Path
        d="M92,290 Q90,310 120,312 Q150,310 148,290 L146,262 Q145,250 120,250 Q95,250 94,262Z"
        fill="#E4B898"
      />
      <Path
        d="M94,262 Q96,254 120,252 Q144,254 146,262 L144,272 Q120,266 96,272Z"
        fill="#C49878" fillOpacity={0.18}
      />

      {/* ── Rosto base ── */}
      <Path
        d="M48,108 Q42,64 64,38 Q88,10 120,8 Q152,10 176,38 Q198,64 192,108 L190,182 Q186,226 164,248 Q146,264 120,266 Q94,264 76,248 Q54,226 50,182Z"
        fill="url(#sk)"
      />

      {/* ── Sombra leve lateral — estrutura e profundidade ── */}
      <Path
        d="M48,108 Q43,78 56,52 Q72,28 94,18"
        stroke="#B88060" strokeWidth={14} fill="none" strokeLinecap="round" fillOpacity={0}
      />
      <Path
        d="M192,108 Q197,78 184,52 Q168,28 146,18"
        stroke="#B88060" strokeWidth={14} fill="none" strokeLinecap="round" fillOpacity={0}
      />

      {/* ── Highlight testa — ponto de luz central ── */}
      <Ellipse cx={118} cy={56}  rx={28} ry={18} fill="#FFFFFF" fillOpacity={0.10} />
      <Ellipse cx={118} cy={57}  rx={13} ry={8}  fill="#FFFFFF" fillOpacity={0.06} />
      {/* Highlight dorso nasal */}
      <Ellipse cx={120} cy={134} rx={4}  ry={14} fill="#FFFFFF" fillOpacity={0.07} />

      {/* ── Zona T ── */}
      <Ellipse cx={120} cy={66} rx={52} ry={44} fill="url(#ztG)" />
      <Rect x={116} y={104} width={8} height={72} rx={4}
        fill="#C8906A" fillOpacity={highOiliness ? 0.09 : 0.03} />

      {/* ── Bochechas — blush editorial, muito suave ── */}
      <Ellipse
        cx={66}  cy={172}
        rx={30} ry={20}
        fill={showRedness ? "#CC5858" : "#E8A0BC"}
        fillOpacity={showRedness ? 0.20 : 0.11}
      />
      <Ellipse
        cx={174} cy={172}
        rx={30} ry={20}
        fill={showRedness ? "#CC5858" : "#E8A0BC"}
        fillOpacity={showRedness ? 0.20 : 0.11}
      />

      {/* ── Sobrancelhas — traço fino e elegante, afina nas pontas ── */}
      <Path
        d="M62,92 Q74,82 90,83 Q96,84 101,87"
        stroke="#1C0A06" strokeWidth={2.6} fill="none" strokeLinecap="round"
      />
      <Path
        d="M62,93 Q74,84 89,85"
        stroke="#1C0A06" strokeWidth={1.2} fill="none" strokeLinecap="round" fillOpacity={0.4}
      />
      <Path
        d="M139,87 Q144,84 160,83 Q176,82 178,92"
        stroke="#1C0A06" strokeWidth={2.6} fill="none" strokeLinecap="round"
      />
      <Path
        d="M151,85 Q166,84 178,92"
        stroke="#1C0A06" strokeWidth={1.2} fill="none" strokeLinecap="round" fillOpacity={0.4}
      />

      {/* ── Olho esquerdo — forma amendoada com profundidade ── */}
      <G>
        {/* Pálpebra inferior */}
        <Path d="M57,109 Q79,120 103,109" stroke="#D4A890" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        {/* Branco */}
        <Path d="M57,109 Q79,97 103,109 Q79,121 57,109Z" fill="#F6F0EA" />
        {/* Íris */}
        <Ellipse cx={80} cy={109} rx={10.5} ry={10}  fill="#4A2E1A" />
        <Ellipse cx={80} cy={109} rx={5.5}  ry={5.8} fill="#050302" />
        {/* Brilho principal */}
        <Ellipse cx={76} cy={105} rx={2.6} ry={2.0}  fill="#FFFFFF" fillOpacity={0.96} />
        {/* Brilho secundário */}
        <Ellipse cx={84} cy={112} rx={1.0} ry={0.8}  fill="#FFFFFF" fillOpacity={0.50} />
        {/* Pálpebra superior */}
        <Path d="M57,109 Q79,97 103,109" stroke="#160806" strokeWidth={1.7} fill="none" strokeLinecap="round" />
        {/* Canto externo */}
        <Path d="M103,109 Q107,105 105,101" stroke="#160806" strokeWidth={1.0} fill="none" strokeLinecap="round" />
        {/* Cílios — 5 finos e delicados */}
        <Line x1={62}  y1={106} x2={58}  y2={98}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={70}  y1={102} x2={68}  y2={94}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={80}  y1={100} x2={80}  y2={92}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={90}  y1={102} x2={92}  y2={94}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={98}  y1={106} x2={103} y2={100} stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
      </G>

      {/* ── Olho direito — espelho ── */}
      <G>
        <Path d="M137,109 Q161,120 183,109" stroke="#D4A890" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        <Path d="M137,109 Q161,97 183,109 Q161,121 137,109Z" fill="#F6F0EA" />
        <Ellipse cx={160} cy={109} rx={10.5} ry={10}  fill="#4A2E1A" />
        <Ellipse cx={160} cy={109} rx={5.5}  ry={5.8} fill="#050302" />
        <Ellipse cx={156} cy={105} rx={2.6}  ry={2.0} fill="#FFFFFF" fillOpacity={0.96} />
        <Ellipse cx={164} cy={112} rx={1.0}  ry={0.8} fill="#FFFFFF" fillOpacity={0.50} />
        <Path d="M137,109 Q161,97 183,109" stroke="#160806" strokeWidth={1.7} fill="none" strokeLinecap="round" />
        <Path d="M137,109 Q133,105 135,101" stroke="#160806" strokeWidth={1.0} fill="none" strokeLinecap="round" />
        <Line x1={178} y1={106} x2={182} y2={98}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={170} y1={102} x2={172} y2={94}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={160} y1={100} x2={160} y2={92}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={150} y1={102} x2={148} y2={94}  stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
        <Line x1={142} y1={106} x2={137} y2={100} stroke="#0C0602" strokeWidth={1.0} strokeLinecap="round" />
      </G>

      {/* ── Nariz — sugestão refinada ── */}
      <Path
        d="M118,122 Q115,148 113,164 Q116,175 120,177 Q124,175 127,164 Q125,148 122,122Z"
        fill="#C89870" fillOpacity={0.18}
      />
      <Path d="M110,165 Q100,168 100,176 Q104,183 115,180 Q111,173 112,166Z"
        fill="#C09070" fillOpacity={0.26} />
      <Path d="M130,165 Q140,168 140,176 Q136,183 125,180 Q129,173 128,166Z"
        fill="#C09070" fillOpacity={0.26} />
      <Ellipse cx={120} cy={174} rx={4} ry={2.5} fill="#FFFFFF" fillOpacity={0.09} />

      {/* ── Boca — cupid's bow definido, nude-rose ── */}
      {/* Arco de cupido + lábio superior */}
      <Path
        d="M96,207 Q104,197 112,199 Q116,196 120,197 Q124,196 128,199 Q136,197 144,207 Q136,214 120,213 Q104,214 96,207Z"
        fill="url(#lU)"
      />
      {/* Sulco do philtrum — define o arco */}
      <Path d="M114,199 Q120,195 126,199" stroke="#C07872" strokeWidth={0.8} fill="none" strokeLinecap="round" />
      {/* Lábio inferior */}
      <Path
        d="M96,207 Q105,225 120,227 Q135,225 144,207 Q136,214 120,213 Q104,214 96,207Z"
        fill="url(#lL)"
      />
      {/* Linha de contato */}
      <Path d="M96,207 Q120,213 144,207" stroke="#A86860" strokeWidth={0.6} fill="none" strokeLinecap="round" />
      {/* Highlight lábio inferior */}
      <Ellipse cx={120} cy={219} rx={13} ry={3.8} fill="#FFFFFF" fillOpacity={0.09} />
      {/* Cantos naturais */}
      <Circle cx={96}  cy={207} r={1.5} fill="#986058" fillOpacity={0.55} />
      <Circle cx={144} cy={207} r={1.5} fill="#986058" fillOpacity={0.55} />

      {/* Sombra queixo */}
      <Ellipse cx={120} cy={258} rx={26} ry={9} fill="#8B5A38" fillOpacity={0.09} />

      {/* ── Manchas — somente se análise indica hiperpigmentação ── */}
      {showSpots && (
        <G>
          <Ellipse cx={152} cy={153} rx={5.5} ry={4}   fill="#6A3C18" fillOpacity={0.22} />
          <Ellipse cx={78}  cy={164} rx={4.5} ry={3.5} fill="#6A3C18" fillOpacity={0.18} />
          <Ellipse cx={132} cy={191} rx={3}   ry={2.2} fill="#6A3C18" fillOpacity={0.14} />
        </G>
      )}
    </Svg>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
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

// ─── Seção de Evidências Individualizada ─────────────────────────────────────
function EvidenceSection({ tipoPele }: { tipoPele: string }) {
  const profile = getSkinTypeRecommendations(tipoPele);

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>
        Recomendações para {profile.label} — Evidência Clínica
      </Text>
      <Text style={s.evidenceHeadline}>{profile.headline}</Text>

      {profile.actives.map((active, i) => {
        const gs = GRADE_STYLES[active.grade];
        return (
          <View key={active.name}>
            <View style={s.evidenceRow}>
              <View style={[s.gradeBadge, { backgroundColor: gs.bg }]}>
                <Text style={[s.gradeBadgeText, { color: gs.color }]}>{gs.label}</Text>
              </View>
              <View style={s.evidenceBody}>
                <Text style={s.evidenceName}>{active.name}</Text>
                <Text style={s.evidenceBenefit}>{active.benefit}</Text>
                {active.caution && (
                  <Text style={s.evidenceCaution}>⚠ {active.caution}</Text>
                )}
                <Text style={s.evidenceSource}>{active.source}</Text>
              </View>
            </View>
            {i < profile.actives.length - 1 && (
              <View style={s.evidenceDivider} />
            )}
          </View>
        );
      })}

      <View style={s.tipsSection}>
        <Text style={s.tipsTitleText}>Notas de Rotina</Text>
        {profile.routineTips.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.tipBullet}>·</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────
export function SkinScanReportPdf({
  session,
  generatedAt,
}: {
  session: SkinAnalysisSession;
  generatedAt: string;
}) {
  const a        = session.analysis;
  const routine  = session.scienceRoutine;
  const products = session.recommendedProducts;
  const tipoPele = tipoPeleFromAnalysis(session);
  const fitz     = fitzparickFromSkinType(tipoPele);
  const dateStr  = new Date(generatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const hidratacao    = scoreFromLabel(a.drynessAppearance.label);
  const oleosidade    = scoreFromLabel(a.oilinessAppearance.label);
  const uniformidade  = { pct: a.toneUniformity.score,    display: a.toneUniformity.label };
  const textura       = { pct: a.skinTexture.score,        display: a.skinTexture.label };
  const luminosidade  = { pct: Math.round((a.toneUniformity.score + a.skinTexture.score) / 2), display: "Estimada" };
  const sensibilidade = scoreFromLabel(a.rednessAppearance.label);

  const focos = a.topConcerns.map(mapConcernLabel);

  // Flags dinâmicos para a ilustração
  const highOiliness = a.oilinessAppearance.zones.length > 0 ||
    a.oilinessAppearance.label.toLowerCase().includes("alta");
  const showRedness  = a.rednessAppearance.label.toLowerCase().includes("alta") ||
    a.rednessAppearance.label.toLowerCase().includes("present");
  const showSpots    = a.topConcerns.some((c) =>
    ["mancha", "uniform", "pigment", "dark_spot"].some((k) => c.toLowerCase().includes(k))
  );

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

  const legendItems = [
    {
      color: highOiliness ? "#C4846B" : "#D4B8A0",
      name: "Zona T",
      val: highOiliness ? "Oleosa" : "Mista",
    },
    {
      color: showRedness ? "#D06060" : "#E4A0B4",
      name: "Bochechas",
      val: showRedness ? "Vermelhidão" : "Normais",
    },
    ...(showSpots
      ? [{ color: "#6A3C18", name: "Manchas", val: "Hiperpigm." }]
      : []),
    { color: "#A89080", name: "Poros", val: a.visiblePores.label },
  ];

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
            <Text style={s.reportLabel}>Relatório Skin Scan</Text>
            <Text style={s.reportDate}>{dateStr}</Text>
          </View>
        </View>

        <View style={s.content}>

          {/* ② BANNER */}
          <View style={s.banner}>
            <View>
              <Text style={s.bannerTitle}>Sua Análise de Pele</Text>
              <Text style={s.bannerSub}>
                Baseada em evidências PubMed · AAD · Orientativa — não substitui avaliação dermatológica
              </Text>
            </View>
            <View style={s.bannerPill}>
              <Text style={s.bannerPillText}>{tipoPele}</Text>
            </View>
          </View>

          {/* ③ GRID PRINCIPAL */}
          <View style={s.grid}>

            {/* ③-A MAPA DE ZONAS */}
            <View style={[s.card, s.leftCol]}>
              <Text style={s.cardTitle}>Mapa de Zonas da Pele</Text>
              <View style={{ alignItems: "center" }}>
                <FaceMapSvg
                  highOiliness={highOiliness}
                  showRedness={showRedness}
                  showSpots={showSpots}
                />
              </View>
              <View style={{ marginTop: 6 }}>
                {legendItems.map((item) => (
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
              <View style={s.card}>
                <Text style={s.cardTitle}>Scores Visuais</Text>
                <ScoreBar label="Hidratação"    pct={100 - hidratacao.pct}    color={C.rose} display={hidratacao.display} />
                <ScoreBar label="Oleosidade"    pct={oleosidade.pct}           color={C.acc}  display={oleosidade.display} />
                <ScoreBar label="Uniformidade"  pct={uniformidade.pct}         color={C.rose} display={uniformidade.display} />
                <ScoreBar label="Textura"       pct={textura.pct}              color={C.acc}  display={textura.display} />
                <ScoreBar label="Luminosidade"  pct={luminosidade.pct}         color={C.rose} display={luminosidade.display} />
                <ScoreBar label="Sensibilidade" pct={sensibilidade.pct}        color={C.gr}   display={sensibilidade.display} />
              </View>

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
                  FPS diário é indispensável para prevenção de manchas e fotoenvelhecimento.
                  Sensibilidade ao sol aumenta o risco de hiperpigmentação pós-inflamatória.
                </Text>
                <View style={s.fitzTags}>
                  {["FPS 50+ obrigatório", "Reaplicar a cada 2h", "Niacinamida para manchas"].map((tag) => (
                    <Text key={tag} style={s.fitzTag}>{tag}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ⑤ EVIDÊNCIAS INDIVIDUALIZADAS */}
          <EvidenceSection tipoPele={tipoPele} />

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
                <Text style={[s.rotinaPeriodTitle, { color: C.acc }]}>Noite & Semanal</Text>
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
            ⚠ Análise orientativa · não substitui avaliação dermatológica · imagem deletada após análise
          </Text>
          <Text style={s.footerText}>belapopoficial.com.br · Skin Scan BelaPop</Text>
        </View>

      </Page>
    </Document>
  );
}
