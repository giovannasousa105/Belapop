import type { Redis } from "ioredis";

import {
  podeEnviar,
  podeEnviarNudgeProduto,
} from "./cooldownGuard";
import {
  calcularHorarioAgendamento,
  calcularHorarioTarde,
  calcularProximoDiaUtil,
} from "./cadenceCalendar";
import type {
  CopilotConfig,
  CopilotSeed,
  DecisaoContexto,
  InteracaoDecidida,
} from "./copilotTypes";

// ─── Engine de decisão ────────────────────────────────────────────────────────
//
// Roda uma vez por ciclo de decisão (chamado pelo scheduler a cada hora).
// Retorna no máximo UMA interação — a de maior prioridade que passou no cooldown.
// ALERTA_REGRESSAO e MARCO_ALCANCADO nunca bloqueados por limite diário.
//
// Critério de performance: < 50ms por usuária excluindo latência de Redis
// (os lookups Redis usam pipeline internamente no cooldownGuard).

export async function decidirInteracaoDoDia(
  config: CopilotConfig,
  seed: CopilotSeed,
  contexto: DecisaoContexto,
  redis: Redis,
  agora: Date = new Date()
): Promise<InteracaoDecidida | null> {
  const { user_id, timezone, horario_manha, horario_noite } = config;

  // ── 1. ALERTA_REGRESSAO (prioridade 1 — bypassa limite diário) ─────────────
  if (seed.alertaAtivo) {
    const { permitido } = await podeEnviar(user_id, "ALERTA_REGRESSAO", redis, agora);
    if (permitido) {
      return {
        tipo: "ALERTA_REGRESSAO",
        config,
        agendado_para: agora,
        requer_claude: true,
        contexto: {
          marcador_foco: seed.marcadorFoco,
          mensagem_base: seed.mensagemMotivacionalCurta,
        },
      };
    }
  }

  // ── 2. MARCO_ALCANCADO (prioridade 1 — bypassa limite diário) ──────────────
  // Só dispara se o insight ainda não foi notificado nesta semana.
  const isNovoMarco =
    seed.ultimoInsightTipo === "MARCO_ALCANCADO" &&
    contexto.ultimoInsightTipoNotificado !== "MARCO_ALCANCADO";

  if (isNovoMarco) {
    const { permitido } = await podeEnviar(user_id, "MARCO_ALCANCADO", redis, agora);
    if (permitido) {
      return {
        tipo: "MARCO_ALCANCADO",
        config,
        agendado_para: agora,
        requer_claude: true,
        contexto: {
          marcador_foco: seed.marcadorFoco,
          mensagem_base: seed.mensagemMotivacionalCurta,
        },
      };
    }
  }

  // ── A partir daqui: limite diário de 3 já é aplicado pelo podeEnviar ───────

  // ── 3. LEMBRETE_SCAN (prioridade 2) ─────────────────────────────────────────
  // Dispara 4 dias antes do scan recomendado (38 dos 42 dias de intervalo).
  if (seed.diasDesdeUltimoScan >= 38) {
    const { permitido } = await podeEnviar(user_id, "LEMBRETE_SCAN", redis, agora);
    if (permitido) {
      return {
        tipo: "LEMBRETE_SCAN",
        config,
        agendado_para: calcularHorarioAgendamento({
          horarioBase: horario_manha,
          timezone,
          agora,
        }),
        requer_claude: false,
        contexto: {
          dias_desde_scan: seed.diasDesdeUltimoScan,
          proximo_scan_recomendado_em: seed.proximoScanRecomendadoEm,
        },
      };
    }
  }

  // ── 4. CHECKIN_SEMANAL (prioridade 2) ────────────────────────────────────────
  if (contexto.diasDesdeUltimoCheckin >= 7) {
    const { permitido } = await podeEnviar(user_id, "CHECKIN_SEMANAL", redis, agora);
    if (permitido) {
      const proximoDiaUtil = calcularProximoDiaUtil(agora);
      return {
        tipo: "CHECKIN_SEMANAL",
        config,
        agendado_para: calcularHorarioAgendamento({
          horarioBase: horario_manha,
          timezone,
          agora: proximoDiaUtil,
        }),
        requer_claude: true,
        contexto: {
          marcador_foco: seed.marcadorFoco,
          rotina_precisa_revisao: seed.rotinaPrecisaRevisao,
          consistencia_pct: contexto.consistenciaSemanalPct,
        },
      };
    }
  }

  // ── 5. NUDGE_RECOMPRA (prioridade 4 — por produto, cooldown individual) ─────
  for (const produto_id of contexto.produtosAcabando) {
    const permitido = await podeEnviarNudgeProduto(user_id, produto_id, redis, agora);
    if (permitido) {
      return {
        tipo: "NUDGE_RECOMPRA",
        config,
        agendado_para: calcularHorarioTarde(timezone, agora),
        requer_claude: true,
        contexto: { produto_id },
      };
    }
  }

  // ── 6. LEMBRETE_MANHA / LEMBRETE_NOITE (prioridade 3) ───────────────────────
  // Usa hora UTC atual como heurística para decidir qual lembrete enviar.
  // O horário exato é calculado no timezone da usuária pelo agendamento.
  const horaUtcAtual = agora.getUTCHours();
  const tipoLembrete =
    horaUtcAtual >= 3 && horaUtcAtual < 15 ? "LEMBRETE_MANHA" : "LEMBRETE_NOITE";
  const horarioBase = tipoLembrete === "LEMBRETE_MANHA" ? horario_manha : horario_noite;

  const { permitido: podeEnviarLembrete } = await podeEnviar(user_id, tipoLembrete, redis, agora);
  if (podeEnviarLembrete) {
    return {
      tipo: tipoLembrete,
      config,
      agendado_para: calcularHorarioAgendamento({ horarioBase, timezone, agora }),
      requer_claude: false,
      contexto: {
        mensagem_motivacional: seed.mensagemMotivacionalCurta,
        periodo: tipoLembrete === "LEMBRETE_MANHA" ? "manha" : "noite",
      },
    };
  }

  return null;
}
