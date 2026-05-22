/**
 * Validação de CNPJ — função pura, sem I/O.
 * Implementa o algoritmo oficial dos dois dígitos verificadores.
 *
 * Retorna false para:
 *   · Strings com comprimento ≠ 14 dígitos (após remover formatação)
 *   · Sequências com todos dígitos iguais (00000000000000, 11111111111111, etc.)
 *   · CNPJs com dígitos verificadores incorretos
 */

export function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");

  if (digits.length !== 14) return false;

  // Sequências repetidas são inválidas
  if (/^(\d)\1+$/.test(digits)) return false;

  // Primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma1  = digits
    .slice(0, 12)
    .split("")
    .reduce((acc, d, i) => acc + parseInt(d, 10) * pesos1[i]!, 0);
  const resto1 = soma1 % 11;
  const dig1   = resto1 < 2 ? 0 : 11 - resto1;

  if (parseInt(digits[12]!, 10) !== dig1) return false;

  // Segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma2  = digits
    .slice(0, 13)
    .split("")
    .reduce((acc, d, i) => acc + parseInt(d, 10) * pesos2[i]!, 0);
  const resto2 = soma2 % 11;
  const dig2   = resto2 < 2 ? 0 : 11 - resto2;

  return parseInt(digits[13]!, 10) === dig2;
}

/**
 * Formatar CNPJ como XX.XXX.XXX/XXXX-XX.
 * Não valida — apenas formata. Usar com validarCNPJ.
 */
export function formatarCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "").slice(0, 14);
  if (d.length < 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
