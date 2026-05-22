// Sanitizar inputs antes de salvar no banco.
// O Supabase ORM já previne SQL injection via parameterização,
// mas sanitizamos igualmente para outputs HTML (XSS) e normalização.

export function sanitizarTexto(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")   // remover tags HTML
    .slice(0, 10_000);
}

export function sanitizarEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 255);
}

export function sanitizarUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Apenas http e https — prevenir javascript: e data: URIs
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizarCnpj(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, "").slice(0, 14);
}

export function sanitizarNome(nome: string): string {
  return nome
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 255);
}

export function sanitizarTelefone(tel: string): string {
  return tel.replace(/[^\d+\-() ]/g, "").slice(0, 20);
}

// Validação de CNPJ (algoritmo oficial)
export function validarCnpj(cnpj: string): boolean {
  const numeros = cnpj.replace(/[^\d]/g, "");
  if (numeros.length !== 14) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;   // sequência repetida

  const calcDigito = (nums: string, tamanho: number): number => {
    let soma = 0;
    let pos  = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(nums.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const resultado = soma % 11;
    return resultado < 2 ? 0 : 11 - resultado;
  };

  const d1 = calcDigito(numeros, 12);
  const d2 = calcDigito(numeros, 13);
  return (
    parseInt(numeros.charAt(12)) === d1 &&
    parseInt(numeros.charAt(13)) === d2
  );
}
