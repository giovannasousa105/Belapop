import type { ClaimValidationInput, ClaimValidationResult, StandardIssue } from "@/lib/catalog-standards/types";

export const ALLOWED_CLAIMS = [
  "Hidratação",
  "Glow",
  "Fortalecimento da barreira",
  "Uniformizacao",
  "Controle de oleosidade",
  "Reducao de aparencia de poros",
  "Suavizacao de textura",
  "Conforto para pele sensível",
  "Proteção solar",
  "Limpeza suave",
  "Acao antioxidante",
  "Conforto",
  "Textura mais macia",
  "Luminosidade",
  "Toque seco",
  "Baixa irritabilidade"
] as const;

export const BLOCKED_CLAIM_TERMS = [
  "o melhor",
  "milagroso",
  "produto milagroso",
  "resultado garantido",
  "resultado imediato garantido",
  "promocao imperdivel",
  "cura",
  "curar",
  "cura acne",
  "100% definitivo",
  "100% sem risco",
  "definitivo",
  "elimina rugas",
  "resultado definitivo",
  "rejuvenesce 20 anos",
  "clareia manchas em dias",
  "dermatologicamente garantido sem comprovacao",
  "anti-idade garantido",
  "rejuvenesce imediatamente",
  "efeito botox",
  "tratamento médico",
  "substitui tratamento médico",
  "substitui dermatologista",
  "sem falhas"
] as const;

export const allowedClaims = ALLOWED_CLAIMS;
export const blockedClaims = BLOCKED_CLAIM_TERMS;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const normalizeInput = (input: ClaimValidationInput): string[] => {
  if (Array.isArray(input)) return input.map((item) => item.trim()).filter(Boolean);
  return input
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const allowedMap = new Map(ALLOWED_CLAIMS.map((claim) => [normalizeText(claim), claim]));

export class ClaimValidator {
  static scanTextForBlockedTerms(text: string): StandardIssue[] {
    const normalized = normalizeText(text);
    return BLOCKED_CLAIM_TERMS.filter((term) => normalized.includes(normalizeText(term))).map(
      (term) => ({
        code: "blocked-claim-term",
        detail: `Remova linguagem proibida: "${term}".`,
        field: "claims",
        label: "Claim bloqueado",
        severity: "critical"
      })
    );
  }

  static validate(input: ClaimValidationInput): ClaimValidationResult {
    const claims = normalizeInput(input);
    const allowed: string[] = [];
    const blocked: string[] = [];
    const unknown: string[] = [];
    const issues: StandardIssue[] = [];

    claims.forEach((claim) => {
      const normalized = normalizeText(claim);
      const hasBlockedTerm = BLOCKED_CLAIM_TERMS.some((term) =>
        normalized.includes(normalizeText(term))
      );

      if (hasBlockedTerm) {
        blocked.push(claim);
        issues.push({
          code: "claim-blacklist",
          detail: `"${claim}" não pode ser publicado no padrao BelaPop.`,
          field: "claims",
          label: "Claim proibido",
          severity: "critical"
        });
        return;
      }

      const mapped = allowedMap.get(normalized);
      if (mapped) {
        allowed.push(mapped);
        return;
      }

      unknown.push(claim);
      issues.push({
        code: "claim-needs-review",
        detail: `"${claim}" precisa de validação editorial ou técnica antes da publicação.`,
        field: "claims",
        label: "Claim fora da whitelist",
        severity: "warning"
      });
    });

    return {
      allowed,
      blocked,
      issues,
      isValid: blocked.length === 0,
      unknown
    };
  }
}

export const validateProductClaims = (input: ClaimValidationInput) =>
  ClaimValidator.validate(input);
