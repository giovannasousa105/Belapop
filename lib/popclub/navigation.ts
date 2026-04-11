import {
  BookOpenText,
  Camera,
  Droplets,
  Flame,
  Gift,
  Home,
  Lightbulb,
  ShoppingBag,
  Sparkles,
  UserCircle2
} from "lucide-react";

export type SkinScanStepId = "focus" | "capture" | "diagnosis" | "concierge";

export const popClubPaths = {
  landing: "/popclub",
  membership: "/popclub/membership",
  activation: "/popclub/ativar",
  welcome: "/popclub/boas-vindas",
  home: "/popclub/inicio",
  radar: "/popclub/radar",
  routine: "/popclub/rotina",
  rewards: "/vitrine",
  belaCode: "/belacode",
  skinScan: "/skin-scan",
  skinScanFocus: "/skin-scan/foco",
  skinScanCapture: "/skin-scan/captura",
  skinScanDiagnosis: "/skin-scan/diagnostico",
  skinScanResult: "/skin-scan/resultado",
  skinScanRoutine: "/skin-scan/rotina",
  faceShield: "/faceshield",
  skincare: "/skincare",
  diary: "/diario"
} as const;

export const skinScanJourneyLinks = [
  {
    id: "focus" as const,
    eyebrow: "STEP 01",
    label: "Selecione seu foco",
    href: popClubPaths.skinScanFocus,
    description: "Escolha as prioridades da pele para personalizar o diagnostico."
  },
  {
    id: "capture" as const,
    eyebrow: "STEP 02",
    label: "Skin Scan ao vivo",
    href: popClubPaths.skinScanCapture,
    description: "Entre na leitura biometrica com captura editorial e feedback em tempo real."
  },
  {
    id: "diagnosis" as const,
    eyebrow: "STEP 03",
    label: "Diagnostico IA",
    href: popClubPaths.skinScanDiagnosis,
    description: "Veja metricas, leitura detalhada e curadoria conectada ao seu perfil."
  },
  {
    id: "concierge" as const,
    eyebrow: "CONCIERGE",
    label: "SkinBela Code",
    href: popClubPaths.belaCode,
    description: "Converse com o concierge IA e aprofunde as recomendacoes com contexto cientifico."
  }
] as const;

export const landingMenuLinks = [
  { label: "PopClub", href: popClubPaths.landing },
  { label: "Membership", href: popClubPaths.membership },
  { label: "Ativar assinatura", href: popClubPaths.activation },
  { label: "Inicio do clube", href: popClubPaths.home, accent: true },
  { label: "Skin Scan", href: popClubPaths.skinScan },
  { label: "Skincare", href: popClubPaths.skincare },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Perfumes", href: "/perfumes" }
] as const;

export const membershipMenuLinks = [
  { label: "PopClub", href: popClubPaths.landing },
  { label: "Membership", href: popClubPaths.membership },
  { label: "Ativar assinatura", href: popClubPaths.activation, accent: true },
  { label: "Inicio do clube", href: popClubPaths.home },
  { label: "Skin Scan", href: popClubPaths.skinScan }
] as const;

export const homeMenuLinks = [
  { label: "PopClub", href: popClubPaths.landing },
  { label: "Membership", href: popClubPaths.membership },
  { label: "Skin Scan", href: popClubPaths.skinScan, accent: true },
  { label: "Radar PopClub", href: popClubPaths.radar },
  { label: "Rotina personalizada", href: popClubPaths.routine },
  { label: "Beneficios", href: popClubPaths.rewards },
  { label: "Skincare", href: popClubPaths.skincare }
] as const;

export const radarMenuLinks = [
  { label: "Inicio PopClub", href: popClubPaths.home },
  { label: "Membership", href: popClubPaths.membership },
  { label: "Radar PopClub", href: popClubPaths.radar, accent: true },
  { label: "Rotina personalizada", href: popClubPaths.routine },
  { label: "Skin Scan", href: popClubPaths.skinScan }
] as const;

export const routineMenuLinks = [
  { label: "PopClub", href: popClubPaths.home },
  { label: "Skin Scan", href: popClubPaths.skinScan },
  { label: "Rotina personalizada", href: popClubPaths.routine, accent: true },
  { label: "Shop skincare", href: popClubPaths.skincare },
  { label: "Discover", href: popClubPaths.diary }
] as const;

export const homeBottomNavItems = [
  { label: "Home", href: popClubPaths.home, icon: Sparkles, active: true },
  { label: "Scan", href: popClubPaths.skinScan, icon: Camera },
  { label: "Benefits", href: popClubPaths.rewards, icon: Gift },
  { label: "Club", href: popClubPaths.landing, icon: UserCircle2 }
] as const;

export const radarBottomNavItems = [
  { label: "Inicio", href: popClubPaths.home, icon: Home },
  { label: "PopClub", href: popClubPaths.landing, icon: Sparkles },
  { label: "Radar", href: popClubPaths.radar, icon: Flame, active: true },
  { label: "Perfil", href: popClubPaths.home, icon: UserCircle2 }
] as const;

export const skinScanBottomNavItems = [
  { label: "Scan", href: popClubPaths.skinScan, icon: Camera, active: true },
  { label: "Routine", href: popClubPaths.skinScanRoutine, icon: Sparkles },
  { label: "Shop", href: popClubPaths.skincare, icon: Droplets },
  { label: "Profile", href: popClubPaths.home, icon: UserCircle2 }
] as const;

export const skinScanPrepBottomNavItems = [
  { label: "Scan", href: popClubPaths.skinScan, icon: Camera, active: true },
  { label: "Routine", href: popClubPaths.skinScanRoutine, icon: Sparkles },
  { label: "Shop", href: popClubPaths.skincare, icon: Lightbulb },
  { label: "Profile", href: popClubPaths.home, icon: UserCircle2 }
] as const;

export const routineBottomNavItems = [
  { label: "Routine", href: popClubPaths.routine, icon: Sparkles, active: true },
  { label: "Shop", href: popClubPaths.skincare, icon: ShoppingBag },
  { label: "Discover", href: popClubPaths.diary, icon: BookOpenText },
  { label: "Profile", href: popClubPaths.home, icon: UserCircle2 }
] as const;
