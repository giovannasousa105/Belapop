/**
 * INVARIANTE: Urgência editorial NUNCA usa tom de varejo.
 *
 * Tom proibido (destrói posicionamento premium):
 *   "URGENTE", "ÚLTIMA CHANCE", "CORRA", "NÃO PERCA",
 *   contador pulsante, cor vermelha para urgência
 *
 * Tom permitido (urgência de atelier):
 *   "X unidades disponíveis neste lote"
 *   "Curadoria encerra domingo"
 *   "Membros Luxo acessam por mais Xh"
 *   Cor âmbar discreta, sem animação
 */

export const TOM_PROIBIDO_URGENCIA = [
  'urgente',
  'última chance',
  'corra',
  'não perca',
  'aproveite',
  'imperdível',
  'oferta relâmpago',
] as const;

export type TomProibido = (typeof TOM_PROIBIDO_URGENCIA)[number];

export function validarCopyUrgencia(texto: string): {
  valido:    boolean;
  violacoes: string[];
} {
  const lower    = texto.toLowerCase();
  const violacoes = TOM_PROIBIDO_URGENCIA.filter((p) => lower.includes(p));
  return { valido: violacoes.length === 0, violacoes: [...violacoes] };
}

export type UrgenciaTipo =
  | 'ACESSO_ANTECIPADO'
  | 'LOTE_ESGOTANDO'
  | 'CURADORIA';

export interface UrgenciaPayload {
  readonly tipo:      UrgenciaTipo;
  readonly texto:     string;   // validado — sem tom proibido
  readonly url:       string;
  readonly label_cta: string;
}

export function criarUrgenciaPayload(
  tipo:      UrgenciaTipo,
  texto:     string,
  url:       string,
  label_cta: string,
): UrgenciaPayload {
  const validacaoTexto = validarCopyUrgencia(texto);
  if (!validacaoTexto.valido) {
    throw new Error(
      `UrgenciaPayload com tom proibido: ${validacaoTexto.violacoes.join(', ')}. ` +
      `Tom BelaPop: editorial, não varejo.`,
    );
  }
  const validacaoCTA = validarCopyUrgencia(label_cta);
  if (!validacaoCTA.valido) {
    throw new Error(
      `Label CTA com tom proibido: ${validacaoCTA.violacoes.join(', ')}.`,
    );
  }
  return { tipo, texto, url, label_cta };
}
