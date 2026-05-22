/**
 * Gerador de mensagens do Skin Copilot.
 *
 * Templates síncronos para tipos sem Claude (LEMBRETE_*, BOAS_VINDAS, LEMBRETE_SCAN).
 * Claude API para check-ins, nudges e alertas — sempre com fallback.
 * Tom: consultora de beleza, nunca bot.
 *
 * INVARIANTE: gerado_por SEMPRE presente — nunca omitir.
 * INVARIANTE: push.titulo MAX 50 chars, push.corpo MAX 100 chars.
 * INVARIANTE: delta_abs e melhora_pts SEMPRE positivos nos prompts.
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { CopilotSeed } from "@/lib/digitalTwin/invariants";
import { CADENCE_RULES, type InteracaoTipo, type CanalEnum } from "./copilotTypes";
import { gerarLembrete, marcadorFocoLabel } from "./templates/lembretes";
import { gerarFallback } from "./templates/fallbacks";
import * as checkinSemanal  from "./prompts/checkinSemanal";
import * as nudgeRecompra   from "./prompts/nudgeRecompra";
import * as alertaRegressao from "./prompts/alertaRegressao";
import * as marcoAlcancado  from "./prompts/marcoAlcancado";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface MensagemGerada {
  tipo:       InteracaoTipo;
  canal_alvo: CanalEnum;
  push?: {
    titulo: string;  // max 50 chars — validado antes de retornar
    corpo:  string;  // max 100 chars — validado antes de retornar
  };
  email?: {
    subject: string;
    body:    string;
    cta?: { label: string; url: string };
  };
  in_app?: {
    titulo:       string;
    corpo:        string;
    cta_tipo?:    "ABRIR_SCAN" | "COMPRAR" | "CHECKIN" | "VER_TWIN";
    cta_payload?: Record<string, string>;
  };
  gerado_por: "TEMPLATE" | "CLAUDE_API" | "FALLBACK";
  gerado_em:  string;
}

export interface MensagemContext {
  user_id:           string;
  nome:              string | null;
  seed:              CopilotSeed;
  rotina?:           { passo: string; produto_nome: string }[];
  streak_dias?:      number;
  produto_acabando?: {
    produto_id:      string;
    produto_nome:    string;
    produto_imagem:  string;
    preco_centavos:  number;
    ativo_principal: string;
    marcador_alvo:   string;
    dias_usados:     number;
    dias_restantes:  number;
    delta_marcador:  number;  // positivo = melhora visível (Math.abs já aplicado)
  };
  twin_insight?: {
    narrativa:        string | null;
    marcadores_piora: Array<{ nome: string; delta_abs: number }>;
    efetividade_pct:  number | null;
  };
}

// ─── gerarMensagem ────────────────────────────────────────────────────────────

export async function gerarMensagem(
  tipo:    InteracaoTipo,
  context: MensagemContext,
  canal:   CanalEnum
): Promise<MensagemGerada> {
  const rule = CADENCE_RULES.find((r) => r.tipo === tipo);
  if (!rule) throw new Error(`InteracaoTipo desconhecido: ${tipo}`);

  let corpo_gerado: string;
  let gerado_por:   MensagemGerada["gerado_por"];

  if (!rule.requer_claude) {
    corpo_gerado = _gerarTemplate(tipo, context);
    gerado_por   = "TEMPLATE";
  } else {
    try {
      corpo_gerado = await _gerarComClaude(tipo, context);
      gerado_por   = "CLAUDE_API";
    } catch {
      corpo_gerado = gerarFallback(tipo, context);
      gerado_por   = "FALLBACK";
    }
  }

  const mensagem = _montarMensagemPorCanal(tipo, corpo_gerado, context, canal);

  // Validar limites de push — truncar, nunca lançar
  if (mensagem.push) {
    mensagem.push.titulo = _truncar(mensagem.push.titulo, 50);
    mensagem.push.corpo  = _truncar(mensagem.push.corpo, 100);
  }

  return { ...mensagem, gerado_por, gerado_em: new Date().toISOString() };
}

// ─── _gerarTemplate ───────────────────────────────────────────────────────────

function _gerarTemplate(tipo: InteracaoTipo, context: MensagemContext): string {
  const lembrete = gerarLembrete({
    tipo,
    nome:                context.nome,
    periodo:             tipo === "LEMBRETE_NOITE" ? "noite" : "manha",
    rotina:              context.rotina ?? [],
    streak_dias:         context.streak_dias ?? 0,
    marcador_foco:       context.seed.marcadorFoco,
    mensagem_fallback:   context.seed.mensagemMotivacionalCurta,
  });
  return lembrete.corpo;
}

// ─── _gerarComClaude ──────────────────────────────────────────────────────────
// Lança em caso de falha — o caller usa gerarFallback.

async function _gerarComClaude(
  tipo:    InteracaoTipo,
  context: MensagemContext
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

  const client = new Anthropic({ apiKey });
  const cfg    = _buildPromptConfig(tipo, context);

  const resultado = await Promise.race([
    client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: cfg.max_tokens,
      system:     cfg.system,
      messages:   [{ role: "user", content: cfg.user }],
    }),
    new Promise<never>((_, rej) => {
      const id = setTimeout(() => rej(new Error("Claude timeout")), cfg.timeout_ms);
      // Não impede o processo de encerrar em testes (ou uso serverless)
      (id as unknown as { unref?(): void }).unref?.();
    }),
  ]);

  const texto = resultado.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  if (!texto) throw new Error("Claude retornou resposta vazia");
  return texto;
}

// ─── _buildPromptConfig ───────────────────────────────────────────────────────

function _buildPromptConfig(tipo: InteracaoTipo, context: MensagemContext): {
  system:      string;
  user:        string;
  max_tokens:  number;
  timeout_ms:  number;
} {
  const nome = context.nome?.split(" ")[0] ?? "você";

  switch (tipo) {
    case "CHECKIN_SEMANAL":
      return {
        system:     checkinSemanal.SYSTEM_PROMPT,
        user:       checkinSemanal.buildUserPrompt({
          nome,
          marcador_foco:    context.seed.marcadorFoco,
          dias_desde_scan:  context.seed.diasDesdeUltimoScan,
          ultimo_insight:   context.seed.ultimoInsightTipo,
          streak:           context.streak_dias ?? 0,
          consistencia_pct: context.twin_insight?.efetividade_pct ?? 0,
          notas_recentes:   [],
          alerta_ativo:     context.seed.alertaAtivo,
        }),
        max_tokens: checkinSemanal.MAX_TOKENS,
        timeout_ms: checkinSemanal.TIMEOUT_MS,
      };

    case "NUDGE_RECOMPRA":
      return {
        system:     nudgeRecompra.SYSTEM_PROMPT,
        user:       nudgeRecompra.buildUserPrompt({
          produto_nome:    context.produto_acabando?.produto_nome ?? "",
          ativo_principal: context.produto_acabando?.ativo_principal ?? "",
          dias_usados:     context.produto_acabando?.dias_usados ?? 0,
          marcador_alvo:   context.produto_acabando?.marcador_alvo ?? "",
          score_atual:     0,
          delta_marcador:  context.produto_acabando?.delta_marcador ?? 0,
          dias_restantes:  context.produto_acabando?.dias_restantes ?? 0,
        }),
        max_tokens: nudgeRecompra.MAX_TOKENS,
        timeout_ms: nudgeRecompra.TIMEOUT_MS,
      };

    case "ALERTA_REGRESSAO":
      return {
        system:     alertaRegressao.SYSTEM_PROMPT,
        user:       alertaRegressao.buildUserPrompt({
          marcadores_piora:    context.twin_insight?.marcadores_piora ?? [],
          marcadores_estaveis: [],
          intervalo_dias:      context.seed.diasDesdeUltimoScan,
          consistencia_pct:    context.twin_insight?.efetividade_pct ?? null,
          estacao:             _estimarEstacao(),
        }),
        max_tokens: alertaRegressao.MAX_TOKENS,
        timeout_ms: alertaRegressao.TIMEOUT_MS,
      };

    case "MARCO_ALCANCADO":
      return {
        system:     marcoAlcancado.SYSTEM_PROMPT,
        user:       marcoAlcancado.buildUserPrompt({
          marcador_nome:        marcadorFocoLabel(context.seed.marcadorFoco),
          melhora_pts:          0,  // fonte: dados históricos do twin
          total_scans:          0,
          semanas_desde_inicio: 0,
          consistencia_media:   context.twin_insight?.efetividade_pct ?? 0,
        }),
        max_tokens: marcoAlcancado.MAX_TOKENS,
        timeout_ms: marcoAlcancado.TIMEOUT_MS,
      };

    default:
      throw new Error(`Tipo ${tipo} não tem prompt Claude configurado`);
  }
}

// ─── _montarMensagemPorCanal ──────────────────────────────────────────────────

type CtaTipo = "ABRIR_SCAN" | "COMPRAR" | "CHECKIN" | "VER_TWIN";

type MensagemParcial = Omit<MensagemGerada, "gerado_por" | "gerado_em"> & {
  push?:   { titulo: string; corpo: string };
  in_app?: { titulo: string; corpo: string; cta_tipo?: CtaTipo; cta_payload?: Record<string, string> };
  email?:  { subject: string; body: string; cta?: { label: string; url: string } };
};

function _montarMensagemPorCanal(
  tipo:    InteracaoTipo,
  corpo:   string,
  context: MensagemContext,
  canal:   CanalEnum
): MensagemParcial {
  const titulo  = _gerarTituloPush(tipo, context);
  const subject = _gerarSubjectEmail(tipo, context);

  const ctaTipoPorInteracao: Record<InteracaoTipo, CtaTipo> = {
    LEMBRETE_MANHA:   "CHECKIN",
    LEMBRETE_NOITE:   "CHECKIN",
    CHECKIN_SEMANAL:  "CHECKIN",
    NUDGE_RECOMPRA:   "COMPRAR",
    ALERTA_REGRESSAO: "ABRIR_SCAN",
    LEMBRETE_SCAN:    "ABRIR_SCAN",
    MARCO_ALCANCADO:  "VER_TWIN",
    BOAS_VINDAS:      "ABRIR_SCAN",
  };

  const ctaPayload: Record<string, string> | undefined =
    tipo === "NUDGE_RECOMPRA" && context.produto_acabando
      ? { produto_id: context.produto_acabando.produto_id }
      : undefined;

  const ctaEmailPorTipo: Partial<Record<InteracaoTipo, { label: string; url: string }>> = {
    CHECKIN_SEMANAL:  { label: "Responder check-in",    url: "/minha-pele" },
    NUDGE_RECOMPRA:   { label: "Ver produto",            url: `/produto/${context.produto_acabando?.produto_id ?? ""}` },
    ALERTA_REGRESSAO: { label: "Refazer análise",        url: "/skin-scan/foco" },
    LEMBRETE_SCAN:    { label: "Analisar minha pele",    url: "/skin-scan/foco" },
    MARCO_ALCANCADO:  { label: "Ver minha evolução",     url: "/minha-pele" },
  };

  const msg: MensagemParcial = { tipo, canal_alvo: canal };

  if (canal === "push" || canal === "in_app") {
    msg.push = { titulo, corpo };
    msg.in_app = {
      titulo,
      corpo,
      cta_tipo:    ctaTipoPorInteracao[tipo],
      cta_payload: ctaPayload,
    };
  }

  if (canal === "email") {
    msg.email = {
      subject,
      body: corpo,
      cta: ctaEmailPorTipo[tipo],
    };
  }

  return msg;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function _gerarTituloPush(tipo: InteracaoTipo, context: MensagemContext): string {
  const nome    = context.nome?.split(" ")[0] ?? "você";
  const streak  = context.streak_dias ?? 0;
  const produto = context.produto_acabando?.produto_nome ?? "produto";

  switch (tipo) {
    case "LEMBRETE_MANHA":
      return streak >= 7 ? `${streak} dias seguidos` : `Bom dia, ${nome}`;
    case "LEMBRETE_NOITE":
      return `Boa noite, ${nome}`;
    case "CHECKIN_SEMANAL":
      return "Como está sua pele esta semana?";
    case "NUDGE_RECOMPRA":
      return `${produto} está acabando`;
    case "ALERTA_REGRESSAO":
      return "Sua pele precisa de atenção";
    case "LEMBRETE_SCAN":
      return "Hora do seu próximo scan";
    case "MARCO_ALCANCADO":
      return "Marco alcançado";
    case "BOAS_VINDAS":
      return `Bem-vinda, ${nome}`;
  }
}

function _gerarSubjectEmail(tipo: InteracaoTipo, context: MensagemContext): string {
  const nome    = context.nome?.split(" ")[0] ?? "você";
  const produto = context.produto_acabando?.produto_nome ?? "produto";

  switch (tipo) {
    case "LEMBRETE_MANHA":
      return `${nome}, sua rotina de manhã te espera`;
    case "LEMBRETE_NOITE":
      return `Rotina noturna de hoje, ${nome}`;
    case "CHECKIN_SEMANAL":
      return "Check-in semanal — como está sua pele?";
    case "NUDGE_RECOMPRA":
      return `${produto} está quase acabando`;
    case "ALERTA_REGRESSAO":
      return "Variação detectada no seu acompanhamento de pele";
    case "LEMBRETE_SCAN":
      return "Hora de analisar sua evolução";
    case "MARCO_ALCANCADO":
      return "Marco alcançado na sua jornada de pele";
    case "BOAS_VINDAS":
      return `Bem-vinda ao BelaPop, ${nome}`;
  }
}

function _truncar(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function _estimarEstacao(): string {
  const mes = new Date().getMonth() + 1;
  if (mes >= 12 || mes <= 2) return "verão";
  if (mes <= 5) return "outono";
  if (mes <= 8) return "inverno";
  return "primavera";
}
