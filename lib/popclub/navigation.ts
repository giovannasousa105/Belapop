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
  rewards: "/popclub/membership#niveis",
  belaCode: "/belacode",
  skinScan: "/skin-scan",
  skinScanFocus: "/skin-scan/foco",
  skinScanCapture: "/skin-scan/captura",
  skinScanDiagnosis: "/skin-scan/diagnóstico",
  skinScanResult: "/skin-scan/resultado",
  skinScanRoutine: "/skin-scan/rotina",
  faceShield: "/faceshield",
  skincare: "/skincare",
  diary: "/diario"
} as const;

export const skinScanJourneyLinks = [
  {
    id: "focus" as const,
    eyebrow: "ETAPA 01",
    label: "Selecione seu foco",
    href: popClubPaths.skinScanFocus,
    description: "Escolha as prioridades do seu cuidado para personalizar a recomendação cosmética."
  },
  {
    id: "capture" as const,
    eyebrow: "ETAPA 02",
    label: "Captura guiada",
    href: popClubPaths.skinScanCapture,
    description: "Envie uma imagem com clareza para apoiar a leitura visual assistida."
  },
  {
    id: "diagnosis" as const,
    eyebrow: "ETAPA 03",
    label: "Leitura da pele",
    href: popClubPaths.skinScanDiagnosis,
    description: "Veja o perfil provável da pele, os sinais visuais e a curadoria conectada ao seu contexto."
  },
  {
    id: "concierge" as const,
    eyebrow: "ROTINA",
    label: "Rotina sugerida",
    href: popClubPaths.belaCode,
    description: "Converse com o concierge IA e aprofunde as recomendações com mais clareza de rotina."
  }
] as const;

export const landingMenuLinks = [
  { label: "PopClub", href: popClubPaths.landing },
  { label: "Clube", href: popClubPaths.membership },
  { label: "Ativar assinatura", href: popClubPaths.activation },
  { label: "Inicio do clube", href: popClubPaths.home, accent: true },
  { label: "Skin Scan", href: popClubPaths.skinScan },
  { label: "Loja", href: "/catalogo" },
  { label: "Diario", href: popClubPaths.diary }
] as const;

export const membershipMenuLinks = [
  { label: "PopClub", href: popClubPaths.landing },
  { label: "Clube", href: popClubPaths.membership },
  { label: "Ativar assinatura", href: popClubPaths.activation, accent: true },
  { label: "Inicio do clube", href: popClubPaths.home },
  { label: "Skin Scan", href: popClubPaths.skinScan }
] as const;

export const homeMenuLinks = [
  { label: "PopClub", href: popClubPaths.landing },
  { label: "Clube", href: popClubPaths.membership },
  { label: "Skin Scan", href: popClubPaths.skinScan, accent: true },
  { label: "Radar PopClub", href: popClubPaths.radar },
  { label: "Rotina personalizada", href: popClubPaths.routine },
  { label: "Beneficios", href: popClubPaths.rewards },
  { label: "Loja", href: "/catalogo" }
] as const;

export const radarMenuLinks = [
  { label: "Inicio PopClub", href: popClubPaths.home },
  { label: "Clube", href: popClubPaths.membership },
  { label: "Radar PopClub", href: popClubPaths.radar, accent: true },
  { label: "Rotina personalizada", href: popClubPaths.routine },
  { label: "Skin Scan", href: popClubPaths.skinScan }
] as const;

export const routineMenuLinks = [
  { label: "PopClub", href: popClubPaths.home },
  { label: "Skin Scan", href: popClubPaths.skinScan },
  { label: "Rotina personalizada", href: popClubPaths.routine, accent: true },
  { label: "Loja", href: "/catalogo" },
  { label: "Diario", href: popClubPaths.diary }
] as const;

export const homeBottomNavItems = [
  { label: "Inicio", href: popClubPaths.home, icon: Sparkles, active: true },
  { label: "Scan", href: popClubPaths.skinScan, icon: Camera },
  { label: "Beneficios", href: popClubPaths.rewards, icon: Gift },
  { label: "Clube", href: popClubPaths.landing, icon: UserCircle2 }
] as const;

export const radarBottomNavItems = [
  { label: "Inicio", href: popClubPaths.home, icon: Home },
  { label: "PopClub", href: popClubPaths.landing, icon: Sparkles },
  { label: "Radar", href: popClubPaths.radar, icon: Flame, active: true },
  { label: "Perfil", href: popClubPaths.home, icon: UserCircle2 }
] as const;

export const skinScanBottomNavItems = [
  { label: "Scan", href: popClubPaths.skinScan, icon: Camera, active: true },
  { label: "Rotina", href: popClubPaths.skinScanRoutine, icon: Sparkles },
  { label: "Loja", href: "/catalogo", icon: Droplets },
  { label: "Conta", href: "/conta", icon: UserCircle2 }
] as const;

export const skinScanPrepBottomNavItems = [
  { label: "Scan", href: popClubPaths.skinScan, icon: Camera, active: true },
  { label: "Rotina", href: popClubPaths.skinScanRoutine, icon: Sparkles },
  { label: "Loja", href: "/catalogo", icon: Lightbulb },
  { label: "Conta", href: "/conta", icon: UserCircle2 }
] as const;

export const routineBottomNavItems = [
  { label: "Rotina", href: popClubPaths.routine, icon: Sparkles, active: true },
  { label: "Loja", href: "/catalogo", icon: ShoppingBag },
  { label: "Diario", href: popClubPaths.diary, icon: BookOpenText },
  { label: "Conta", href: "/conta", icon: UserCircle2 }
] as const;
