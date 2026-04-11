const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const normalizeCpf = (value: unknown) => {
  if (typeof value !== "string") return "";
  return onlyDigits(value);
};

export const isValidCpf = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (factor: number) => {
    let total = 0;
    for (const char of digits.slice(0, factor - 1)) {
      total += Number(char) * factor--;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calc(10) === Number(digits[9]) && calc(11) === Number(digits[10]);
};

export const hasMinTwoWords = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length >= 2;

export const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return "";
  return onlyDigits(value);
};
