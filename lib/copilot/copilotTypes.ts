import type { CopilotSeed } from "@/lib/digitalTwin/invariants";

// ─── Enums de domínio ─────────────────────────────────────────────────────────

export type InteracaoTipo =
  | "LEMBRETE_MANHA"
  | "LEMBRETE_NOITE"
  | "CHECKIN_SEMANAL"
  | "NUDGE_RECOMPRA"
  | "ALERTA_REGRESSAO"
  | "LEMBRETE_SCAN"
  | "MARCO_ALCANCADO"
  | "BOAS_VINDAS";

export type CanalEnum = "push" | "email" | "in_app";

export type InteracaoStatus = "ENVIADA" | "ENTREGUE" | "LIDA" | "RESPONDIDA" | "FALHOU";

export type RespostaTipo =
  | "CHECKIN_ROTINA"
  | "NOTA_PELE"
  | "RECOMPRA_ACEITA"
  | "RECOMPRA_RECUSADA"
  | "SCAN_AGENDADO"
  | "DESCARTADA";

// ─── Regras de cadência ───────────────────────────────────────────────────────

export interface CadenceRule {
  tipo: InteracaoTipo;
  cooldown_horas: number;
  max_por_semana: number;
  prioridade: number;
  requer_claude: boolean;
}

export const CADENCE_RULES: CadenceRule[] = [
  { tipo: "LEMBRETE_MANHA",   cooldown_horas: 20,  max_por_semana: 7, prioridade: 3, requer_claude: false },
  { tipo: "LEMBRETE_NOITE",   cooldown_horas: 20,  max_por_semana: 7, prioridade: 3, requer_claude: false },
  { tipo: "CHECKIN_SEMANAL",  cooldown_horas: 144, max_por_semana: 1, prioridade: 2, requer_claude: true  },
  { tipo: "NUDGE_RECOMPRA",   cooldown_horas: 720, max_por_semana: 1, prioridade: 4, requer_claude: true  },
  { tipo: "ALERTA_REGRESSAO", cooldown_horas: 336, max_por_semana: 1, prioridade: 1, requer_claude: true  },
  { tipo: "LEMBRETE_SCAN",    cooldown_horas: 168, max_por_semana: 1, prioridade: 2, requer_claude: false },
  { tipo: "MARCO_ALCANCADO",  cooldown_horas: 0,   max_por_semana: 1, prioridade: 1, requer_claude: true  },
  { tipo: "BOAS_VINDAS",     cooldown_horas: 0,   max_por_semana: 1, prioridade: 1, requer_claude: false },
];

export const CADENCE_MAP = new Map<InteracaoTipo, CadenceRule>(
  CADENCE_RULES.map((r) => [r.tipo, r])
);

// Tipos que ignoram o limite diário de 3 interações — nunca bloqueados por cooldown
// de outros tipos; apenas o cooldown do próprio tipo se aplica.
export const ALTA_PRIORIDADE = new Set<InteracaoTipo>(["ALERTA_REGRESSAO", "MARCO_ALCANCADO"]);

// ─── Configuração da usuária ──────────────────────────────────────────────────

export interface CopilotConfig {
  id: string;
  user_id: string;
  twin_id: string | null;
  ativo: boolean;
  horario_manha: string;  // "HH:MM"
  horario_noite: string;  // "HH:MM"
  timezone: string;
  canal_preferido: CanalEnum;
  aceita_push: boolean;
  aceita_email: boolean;
}

// ─── Interação decidida pelo engine ──────────────────────────────────────────

export interface InteracaoDecidida {
  tipo: InteracaoTipo;
  config: CopilotConfig;
  agendado_para: Date;
  requer_claude: boolean;
  contexto: Record<string, unknown>;
}

// ─── Contexto pré-buscado para a decisão ────────────────────────────────────

export interface DecisaoContexto {
  diasDesdeUltimoCheckin: number;
  produtosAcabando: string[];           // product_ids com < 10 dias estimados
  ultimoInsightTipoNotificado: string | null;
  consistenciaSemanalPct: number;       // 0–100 calculada dos check-ins
}

// ─── Mensagem gerada (template ou Claude) ────────────────────────────────────

export interface MensagemGerada {
  titulo: string;
  corpo: string;
  cta?: string;
  metadata?: Record<string, unknown>;
}

// ─── Linha da tabela copilot_interacoes ──────────────────────────────────────

export interface CopilotInteracaoRow {
  id: string;
  user_id: string;
  twin_id: string | null;
  tipo: InteracaoTipo;
  canal: CanalEnum;
  status: InteracaoStatus;
  mensagem_id: string | null;
  payload: Record<string, unknown> | null;
  seed_snapshot: Record<string, unknown> | null;
  respondida_em: string | null;
  criado_em: string;
}

// Alias público — usado pelos guards e feed
export type CopilotInteracao = CopilotInteracaoRow;

// Re-export para uso nos workers e engines
export type { CopilotSeed };
