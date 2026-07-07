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

// ─── SVG Face — Ilustração editorial estilizada ──────────────────────────────
// Zonas são dinâmicas: refletem os achados reais da análise.
// Manchas aparecem somente se o perfil indica hiperpigmentação.
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
    <Svg width={150} viewBox="0 0 240 314">
      <Defs>
        {/* Gradiente de pele — perolado, luminoso */}
        <RadialGradient id="sk" cx="44%" cy="30%" r="66%">
          <Stop offset="0%"   stopColor="#FEE9D6" />
          <Stop offset="28%"  stopColor="#F5D0AE" />
          <Stop offset="62%"  stopColor="#EAB892" />
          <Stop offset="100%" stopColor="#D4A07C" />
        </RadialGradient>
        {/* Zona T — rose-gold suave, intensidade varia com oleosidade */}
        <LinearGradient id="ztG" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#C4846B" stopOpacity={highOiliness ? 0.38 : 0.18} />
          <Stop offset="60%"  stopColor="#C4846B" stopOpacity={highOiliness ? 0.14 : 0.06} />
          <Stop offset="100%" stopColor="#C4846B" stopOpacity={0} />
        </LinearGradient>
        {/* Lábio superior */}
        <LinearGradient id="lU" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#C8887E" />
          <Stop offset="100%" stopColor="#AA6E68" />
        </LinearGradient>
        {/* Lábio inferior */}
        <LinearGradient id="lL" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#D29890" />
          <Stop offset="60%"  stopColor="#BC8080" />
          <Stop offset="100%" stopColor="#AA6E68" />
        </LinearGradient>
      </Defs>

      {/* Cabelo — castanho escuro quente */}
      <Ellipse cx={120} cy={46} rx={80} ry={58} fill="#201008" />
      <Path
        d="M42,92 Q36,46 60,20 Q84,-4 120,-2 Q156,-4 180,20 Q204,46 198,92 Q182,58 162,42 Q142,28 120,26 Q98,28 78,42 Q58,58 42,92Z"
        fill="#201008"
      />

      {/* Orelhas */}
      <Path d="M46,122 Q32,122 30,138 Q28,156 35,166 Q41,174 50,170 Q46,160 46,146 Q46,132 50,124Z" fill="#E4B898" />
      <Path d="M194,122 Q208,122 210,138 Q212,156 205,166 Q199,174 190,170 Q194,160 194,146 Q194,132 190,124Z" fill="#E4B898" />

      {/* Pescoço */}
      <Path
        d="M90,288 Q88,308 120,310 Q152,308 150,288 L150,260 Q149,248 120,248 Q91,248 90,260Z"
        fill="#E4B898"
      />

      {/* Rosto base */}
      <Path
        d="M50,106 Q44,62 66,37 Q90,11 120,9 Q150,11 174,37 Q196,62 190,106 L188,178 Q184,222 162,244 Q144,260 120,262 Q96,260 78,244 Q56,222 52,178Z"
        fill="url(#sk)"
      />

      {/* Highlight perolado — testa/fronte */}
      <Ellipse cx={120} cy={60} rx={30} ry={20} fill="#FFFFFF" fillOpacity={0.1} />
      <Ellipse cx={122} cy={124} rx={6}  ry={10} fill="#FFFFFF" fillOpacity={0.07} />

      {/* Zona T */}
      <Ellipse cx={120} cy={68} rx={54} ry={42} fill="url(#ztG)" />
      <Rect x={113} y={102} width={14} height={78} rx={7} fill="#C4846B" fillOpacity={highOiliness ? 0.13 : 0.06} />

      {/* Bochechas — blush suave (vermelhidão ou rosa elegante) */}
      <Ellipse
        cx={70}  cy={168}
        rx={34} ry={26}
        fill={showRedness ? "#D06060" : "#E4A0B4"}
        fillOpacity={showRedness ? 0.26 : 0.14}
      />
      <Ellipse
        cx={170} cy={168}
        rx={34} ry={26}
        fill={showRedness ? "#D06060" : "#E4A0B4"}
        fillOpacity={showRedness ? 0.26 : 0.14}
      />

      {/* Sobrancelhas — arco suave */}
      <Path d="M60,90 Q77,80 97,84" stroke="#201008" strokeWidth={4.2} fill="none" strokeLinecap="round" />
      <Path d="M143,84 Q163,80 180,90" stroke="#201008" strokeWidth={4.2} fill="none" strokeLinecap="round" />

      {/* Olho esquerdo */}
      <G>
        <Path d="M59,106 Q79,96 100,106 Q79,116 59,106Z" fill="#F4EEE6" />
        <Ellipse cx={79} cy={106} rx={11} ry={10.5} fill="#4A2E18" />
        <Ellipse cx={79} cy={106} rx={5.8} ry={6.1} fill="#060402" />
        <Ellipse cx={75} cy={102} rx={2.8} ry={2.1} fill="#FFFFFF" fillOpacity={0.94} />
        <Ellipse cx={82} cy={109} rx={1.2} ry={1}   fill="#FFFFFF" fillOpacity={0.55} />
        <Path d="M59,106 Q79,94 100,106" stroke="#180A04" strokeWidth={2} fill="none" strokeLinecap="round" />
        {/* Cílios */}
        {([60,65,71,79,87,93,98] as number[]).map((x, i) => (
          <Line key={i} x1={x} y1={104} x2={x + (x < 79 ? -2.5 : x === 79 ? 0 : 1.8)} y2={97} stroke="#0E0602" strokeWidth={1.2} strokeLinecap="round" />
        ))}
      </G>

      {/* Olho direito */}
      <G>
        <Path d="M140,106 Q161,96 181,106 Q161,116 140,106Z" fill="#F4EEE6" />
        <Ellipse cx={161} cy={106} rx={11} ry={10.5} fill="#4A2E18" />
        <Ellipse cx={161} cy={106} rx={5.8} ry={6.1} fill="#060402" />
        <Ellipse cx={157} cy={102} rx={2.8} ry={2.1} fill="#FFFFFF" fillOpacity={0.94} />
        <Ellipse cx={164} cy={109} rx={1.2} ry={1}   fill="#FFFFFF" fillOpacity={0.55} />
        <Path d="M140,106 Q161,94 181,106" stroke="#180A04" strokeWidth={2} fill="none" strokeLinecap="round" />
        {/* Cílios */}
        {([142,147,153,161,169,175,180] as number[]).map((x, i) => (
          <Line key={i} x1={x} y1={104} x2={x + (x < 161 ? -2.5 : x === 161 ? 0 : 1.8)} y2={97} stroke="#0E0602" strokeWidth={1.2} strokeLinecap="round" />
        ))}
      </G>

      {/* Nariz */}
      <Path d="M116,118 Q112,144 110,160 Q114,172 120,174 Q126,172 130,160 Q128,144 124,118Z" fill="#D0A070" fillOpacity={0.26} />
      <Path d="M108,160 Q98,164 98,172 Q103,180 113,177 Q109,170 110,162Z" fill="#C09068" fillOpacity={0.35} />
      <Path d="M132,160 Q142,164 142,172 Q137,180 127,177 Q131,170 130,162Z" fill="#C09068" fillOpacity={0.35} />

      {/* Boca — nude-rose elegante */}
      <Path d="M94,204 Q103,194 112,196 Q120,194 128,196 Q137,194 146,204 Q137,211 120,210 Q103,211 94,204Z" fill="url(#lU)" />
      <Path d="M94,204 Q103,222 120,224 Q137,222 146,204 Q137,211 120,210 Q103,211 94,204Z" fill="url(#lL)" />
      <Path d="M94,204 Q120,210 146,204" stroke="#9A6058" strokeWidth={0.7} fill="none" strokeLinecap="round" />
      <Ellipse cx={120} cy={215} rx={14} ry={4.5} fill="#FFFFFF" fillOpacity={0.09} />

      {/* Manchas — apenas se análise indica hiperpigmentação */}
      {showSpots && (
        <G>
          <Ellipse cx={152} cy={150} rx={6}   ry={4.5} fill="#6A3C18" fillOpacity={0.28} />
          <Ellipse cx={77}  cy={161} rx={5}   ry={4}   fill="#6A3C18" fillOpacity={0.23} />
          <Ellipse cx={130} cy={188} rx={3.5} ry={2.5} fill="#6A3C18" fillOpacity={0.18} />
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
