/**
 * INVARIANTE DE DOMÍNIO — TRANSIÇÕES DE STATUS DO SELLER
 *
 * Seller NUNCA vai direto para ATIVO sem passar por EM_VERIFICACAO.
 * A sequência obrigatória é:
 *
 *   RASCUNHO → AGUARDANDO_DOCS → EM_VERIFICACAO → APROVADO_PARCIAL → ATIVO
 *
 * Aprovação requer Stripe Connect completo E todos os documentos aprovados.
 * Qualquer atalho nessa sequência é uma violação da invariante.
 *
 * Motivação: um seller pode publicar lotes e receber pagamentos.
 * Ativar sem verificação expõe o marketplace a fraude e problemas regulatórios.
 */

// ─── Tipo de status ───────────────────────────────────────────────────────────

export type SellerStatus =
  | "RASCUNHO"
  | "AGUARDANDO_DOCS"
  | "EM_VERIFICACAO"
  | "APROVADO_PARCIAL"
  | "ATIVO"
  | "SUSPENSO"
  | "REPROVADO";

// ─── Transições válidas ───────────────────────────────────────────────────────

const TRANSICOES_VALIDAS = new Set<string>([
  "RASCUNHO→AGUARDANDO_DOCS",
  "AGUARDANDO_DOCS→EM_VERIFICACAO",
  "EM_VERIFICACAO→APROVADO_PARCIAL",
  "EM_VERIFICACAO→REPROVADO",
  "APROVADO_PARCIAL→ATIVO",
  "ATIVO→SUSPENSO",
  "SUSPENSO→ATIVO",
]);

// ─── TransicaoResult ──────────────────────────────────────────────────────────

export interface TransicaoResult {
  valida: boolean;
  motivo?: string;
}

export function validarTransicaoSeller(
  de:   SellerStatus,
  para: SellerStatus
): TransicaoResult {
  if (TRANSICOES_VALIDAS.has(`${de}→${para}`)) {
    return { valida: true };
  }
  return {
    valida: false,
    motivo:
      `Transição inválida: ${de} → ${para}. ` +
      `Sequência obrigatória: RASCUNHO → AGUARDANDO_DOCS → EM_VERIFICACAO ` +
      `→ APROVADO_PARCIAL → ATIVO.`,
  };
}

// ─── assertPodeAprovar ────────────────────────────────────────────────────────
// Lançar antes de qualquer UPDATE sellers SET status = 'ATIVO'.

export interface SellerParaAprovacao {
  readonly id:                     string;
  readonly status:                 SellerStatus;
  readonly stripe_account_id:      string | null;
  readonly stripe_charges_enabled: boolean;
  readonly stripe_payouts_enabled: boolean;
  readonly documentos_pendentes:   number;  // contagem de docs com status PENDENTE
}

export function assertPodeAprovar(seller: SellerParaAprovacao): void {
  if (!seller.stripe_account_id) {
    throw new Error(
      `Seller ${seller.id} não pode ser aprovado: Stripe Connect não configurado. ` +
      `stripe_account_id ausente. Iniciar onboarding do Stripe antes de aprovar.`
    );
  }
  if (!seller.stripe_charges_enabled) {
    throw new Error(
      `Seller ${seller.id} não pode ser aprovado: ` +
      `stripe_charges_enabled = false. Aguardar verificação pelo Stripe.`
    );
  }
  if (!seller.stripe_payouts_enabled) {
    throw new Error(
      `Seller ${seller.id} não pode ser aprovado: ` +
      `stripe_payouts_enabled = false. Aguardar configuração de repasses no Stripe.`
    );
  }
  if (seller.documentos_pendentes > 0) {
    throw new Error(
      `Seller ${seller.id} não pode ser aprovado: ` +
      `${seller.documentos_pendentes} documento(s) ainda pendente(s). ` +
      `Todos os documentos devem estar com status APROVADO.`
    );
  }
  const transicao = validarTransicaoSeller(seller.status, "ATIVO");
  if (!transicao.valida) {
    throw new Error(
      `Seller ${seller.id} não pode ser aprovado: ${transicao.motivo}`
    );
  }
}
