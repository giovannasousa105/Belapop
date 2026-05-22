/**
 * Templates síncronos para lembretes do Copilot.
 * Sem Claude API, sem I/O. Nunca retornam string vazia.
 */

import type { InteracaoTipo } from "../copilotTypes";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LembreteContext {
  tipo:                InteracaoTipo;
  nome:                string | null;
  periodo:             "manha" | "noite";
  rotina:              { passo: string; produto_nome: string }[];
  streak_dias:         number;
  marcador_foco:       string;
  mensagem_fallback?:  string;  // seed.mensagemMotivacionalCurta para tipos sem template
}

// ─── Labels de marcadores ─────────────────────────────────────────────────────

const MARCADOR_LABELS: Record<string, string> = {
  acne:         "Acne",
  oleosidade:   "Oleosidade",
  poros:        "Poros",
  textura:      "Textura",
  pigmentacao:  "Pigmentação",
  vermelhidao:  "Vermelhidão",
  ressecamento: "Ressecamento",
};

export function marcadorFocoLabel(marcador: string): string {
  return MARCADOR_LABELS[marcador] ?? "Sua pele";
}

// ─── Streak badge (para CTA visual in_app) ────────────────────────────────────

export function streakBadge(streak: number): string | null {
  if (streak < 3)  return null;
  if (streak >= 42) return `6 semanas de consistência`;
  if (streak >= 21) return `21 dias — sua pele está notando`;
  if (streak >= 7)  return `${streak} dias seguidos`;
  return null;
}

// ─── gerarLembrete ────────────────────────────────────────────────────────────

export function gerarLembrete(ctx: LembreteContext): { titulo: string; corpo: string } {
  const nome = ctx.nome?.split(" ")[0] ?? "você";
  const primeiroProduto = ctx.rotina[0]?.produto_nome ?? "seu primeiro produto";
  const marcador = marcadorFocoLabel(ctx.marcador_foco);

  switch (ctx.tipo) {
    case "LEMBRETE_MANHA":
      return gerarLembreteManha(nome, primeiroProduto, marcador, ctx.streak_dias);

    case "LEMBRETE_NOITE":
      return gerarLembreteNoite(nome, primeiroProduto, ctx.streak_dias);

    case "LEMBRETE_SCAN":
      return {
        titulo: "Hora de ver sua evolução",
        corpo:  "Seu próximo scan está próximo. Compare com onde você começou.",
      };

    case "BOAS_VINDAS":
      return {
        titulo: `Bem-vinda ao PopClub, ${nome}`,
        corpo:  "Sua primeira análise de pele está disponível. Comece agora.",
      };

    default:
      // Para tipos que requerem Claude (CHECKIN_SEMANAL, NUDGE_RECOMPRA, etc.)
      // retornar a mensagem motivacional do seed como fallback de template
      return {
        titulo: marcador,
        corpo:  ctx.mensagem_fallback ?? "Continue com sua rotina de cuidados.",
      };
  }
}

// ─── Variações por período e streak ──────────────────────────────────────────

function gerarLembreteManha(
  nome: string,
  primeiroProduto: string,
  marcador: string,
  streak: number
): { titulo: string; corpo: string } {
  if (streak <= 2) {
    return {
      titulo: "Sua rotina de manhã",
      corpo:  `Comece com ${primeiroProduto}. ${marcador} precisa de atenção consistente.`,
    };
  }
  if (streak <= 6) {
    return {
      titulo: `Bom dia, ${nome}`,
      corpo:  `${streak} dias de rotina. Continue.`,
    };
  }
  if (streak <= 20) {
    return {
      titulo: `${streak} dias seguidos, ${nome}`,
      corpo:  "Sua rotina de manhã está funcionando. Continue.",
    };
  }
  // streak 21+
  return {
    titulo: "3 semanas de consistência",
    corpo:  "Sua pele está registrando isso. Próximo scan em breve.",
  };
}

function gerarLembreteNoite(
  nome: string,
  primeiroProduto: string,
  streak: number
): { titulo: string; corpo: string } {
  if (streak <= 2) {
    return {
      titulo: "Rotina noturna",
      corpo:  `É na noite que a pele recupera. ${primeiroProduto} primeiro.`,
    };
  }
  return {
    titulo: `Boa noite, ${nome}`,
    corpo:  `${streak} dias de cuidado. Sua pele está notando.`,
  };
}
