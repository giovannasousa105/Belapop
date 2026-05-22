/**
 * INVARIANTE: Quiz SEMPRE leva ao Skin Scan — nunca substitui.
 *
 * O quiz é porta de entrada, não destino final.
 * O resultado do quiz DEVE sempre exibir CTA para /skin-scan/foco.
 * Sem o Skin Scan, não há Digital Twin, Copilot ou personalização real.
 *
 * Resultado do quiz sem CTA para Skin Scan = funil incompleto.
 */

// ─── Mapas de domínio (extraídos aqui para evitar dependências de UI) ─────────

export const MAPA_PREOCUPACAO: Record<string, string[]> = {
  acne:         ['tratamento_acne', 'controle_sebaceo'],
  manchas:      ['uniformizacao_tom', 'clareamento'],
  hidratacao:   ['hidratacao_profunda', 'barreira'],
  rugas:        ['anti-idade', 'firmeza'],
  oleosidade:   ['controle_sebaceo', 'balanceamento_sebaceo'],
  sensibilidade: ['calmante_barreira', 'hidratacao_profunda'],
  poros:        ['refinamento_textura', 'controle_sebaceo'],
  textura:      ['renovacao_celular', 'refinamento_textura'],
};

export const OPCOES_INVESTIMENTO: Record<string, number> = {
  ate_100:      10000,   // em centavos
  ate_250:      25000,
  ate_500:      50000,
  acima_500:    999999,
};

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface QuizResultadoValido {
  readonly tipo_pele_inferido: string;
  readonly necessidades:       string[];
  readonly produtos_sugeridos: unknown[];
  readonly skin_scan_cta:      true;   // literal type — SEMPRE true
  readonly faixa_preco_max:    number;
}

// ─── assertQuizResultadoValido ────────────────────────────────────────────────

export function assertQuizResultadoValido(
  resultado: unknown,
): asserts resultado is QuizResultadoValido {
  if (!resultado || typeof resultado !== 'object') {
    throw new Error('QuizResultado inválido: não é objeto.');
  }
  const r = resultado as Record<string, unknown>;
  if (r.skin_scan_cta !== true) {
    throw new Error(
      'QuizResultado sem skin_scan_cta: true. ' +
      'O quiz DEVE sempre exibir CTA para o Skin Scan. ' +
      'O quiz é porta de entrada — o Scan é o destino.',
    );
  }
}

// ─── inferirResultadoValido ───────────────────────────────────────────────────

export function inferirResultadoValido(
  respostas: { preocupacao: string; tipo_pele: string; investimento: string },
  produtos:  unknown[],
): QuizResultadoValido {
  const necessidades = MAPA_PREOCUPACAO[respostas.preocupacao] ?? [];
  const preco_max    = OPCOES_INVESTIMENTO[respostas.investimento] ?? 999999;

  return {
    tipo_pele_inferido: respostas.tipo_pele,
    necessidades,
    produtos_sugeridos: produtos,
    skin_scan_cta:      true,   // literal true — nunca pode ser false
    faixa_preco_max:    preco_max,
  };
}
