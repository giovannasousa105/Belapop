/**
 * validarCNPJ.test.ts
 *
 * Testa o validador de CNPJ — função pura, sem I/O.
 */

import { validarCNPJ, formatarCNPJ } from "../validarCNPJ";

// ─── CNPJs válidos conhecidos ─────────────────────────────────────────────────

describe("validarCNPJ — casos válidos", () => {
  test.each([
    ["11.444.777/0001-61", "formatado com pontuação"],
    ["11444777000161",     "apenas dígitos"],
    ["11.222.333/0001-81", "CNPJ de teste padrão"],
  ])("%s (%s): retorna true", (cnpj) => {
    expect(validarCNPJ(cnpj)).toBe(true);
  });
});

// ─── CNPJs inválidos ──────────────────────────────────────────────────────────

describe("validarCNPJ — casos inválidos", () => {
  test("CNPJ curto: retorna false", () => {
    expect(validarCNPJ("123")).toBe(false);
  });

  test("CNPJ longo demais: retorna false", () => {
    expect(validarCNPJ("123456789012345")).toBe(false);
  });

  test("todos os dígitos iguais (00000000000000): retorna false", () => {
    expect(validarCNPJ("00.000.000/0000-00")).toBe(false);
  });

  test("todos os dígitos 1 (11111111111111): retorna false", () => {
    expect(validarCNPJ("11.111.111/1111-11")).toBe(false);
  });

  test("dígito verificador errado: retorna false", () => {
    // 11.444.777/0001-61 é válido; 11.444.777/0001-62 é inválido
    expect(validarCNPJ("11.444.777/0001-62")).toBe(false);
  });

  test("segundo dígito verificador errado: retorna false", () => {
    expect(validarCNPJ("11.222.333/0001-82")).toBe(false);
  });

  test("string vazia: retorna false", () => {
    expect(validarCNPJ("")).toBe(false);
  });

  test("apenas letras: retorna false", () => {
    expect(validarCNPJ("CNPJ invalido")).toBe(false);
  });
});

// ─── formatarCNPJ ─────────────────────────────────────────────────────────────

describe("formatarCNPJ", () => {
  test("formata corretamente com pontuação", () => {
    expect(formatarCNPJ("11444777000161")).toBe("11.444.777/0001-61");
  });

  test("formata mesmo com pontuação já presente", () => {
    expect(formatarCNPJ("11.444.777/0001-61")).toBe("11.444.777/0001-61");
  });

  test("não quebra com menos de 14 dígitos", () => {
    expect(() => formatarCNPJ("123")).not.toThrow();
  });
});
