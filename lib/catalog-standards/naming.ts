import { BLOCKED_CLAIM_TERMS } from "@/lib/catalog-standards/claims";
import type { ProductNameNormalizationResult, StandardIssue } from "@/lib/catalog-standards/types";

type ProductNameParts = {
  activeOrDifferential?: string;
  brand?: string;
  line?: string;
  productType?: string;
  volume?: string;
};

const smallWords = new Set(["a", "as", "de", "da", "das", "do", "dos", "e", "em", "para", "por", "com"]);

const compact = (value: string) => value.replace(/\s+/g, " ").trim();

const hasEmoji = (value: string) => /[\u{1f300}-\u{1faff}\u{2600}-\u{27bf}]/u.test(value);

const normalizeForCompare = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const hasExcessiveCaps = (value: string) => {
  const letters = value.replace(/[^A-Za-z]/g, "");
  if (letters.length < 10) return false;
  const uppercase = letters.replace(/[^A-Z]/g, "");
  return uppercase.length / letters.length > 0.72;
};

const hasDuplicatedWords = (value: string) => {
  const words = normalizeForCompare(value).split(/\s+/).filter(Boolean);
  return words.some((word, index) => index > 0 && words[index - 1] === word);
};

const removeConsecutiveDuplicatedWords = (value: string) => {
  const words = compact(value).split(" ");
  return words.filter((word, index) => index === 0 || normalizeForCompare(word) !== normalizeForCompare(words[index - 1])).join(" ");
};

const normalizeVolume = (value: string) =>
  value
    .replace(/\b(\d+)\s*ML\b/gi, "$1ml")
    .replace(/\b(\d+)\s*G\b/g, "$1g")
    .replace(/\b(\d+)\s*KG\b/gi, "$1kg");

const titleCase = (value: string) =>
  normalizeVolume(value)
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (/^\d+(ml|g|kg)$/i.test(word)) return word.toLowerCase();
      if (word === "ph") return "pH";
      if (word === "fps") return "FPS";
      if (word.length === 1) return word.toUpperCase();
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

const buildNameFromParts = (parts: ProductNameParts) =>
  [
    parts.brand,
    parts.line,
    parts.productType,
    parts.activeOrDifferential,
    parts.volume
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

export function normalizeProductName(
  input: string,
  parts: ProductNameParts = {}
): ProductNameNormalizationResult {
  const original = input ?? "";
  const structuredSource = compact(buildNameFromParts(parts));
  const sourceForIssues = compact(original || structuredSource);
  const sourceForValue = structuredSource || sourceForIssues;
  const issues: StandardIssue[] = [];

  if (!sourceForIssues) {
    return {
      blocked: true,
      issues: [
        {
          code: "empty-product-name",
          detail: "O SKU precisa de um nome antes de entrar na curadoria.",
          field: "name",
          label: "Nome ausente",
          severity: "critical"
        }
      ],
      original,
      value: ""
    };
  }

  if (hasEmoji(sourceForIssues)) {
    issues.push({
      code: "emoji-in-name",
      detail: "Remova emojis do titulo do SKU.",
      field: "name",
      label: "Emoji no nome",
      severity: "critical"
    });
  }

  if (hasExcessiveCaps(sourceForIssues)) {
    issues.push({
      code: "excessive-caps",
      detail: "Use caixa editorial, sem CAPS LOCK excessivo.",
      field: "name",
      label: "Caixa alta excessiva",
      severity: "critical"
    });
  }

  if (sourceForIssues.length > 82) {
    issues.push({
      code: "product-name-too-long",
      detail: "Reduza o titulo para uma estrutura clara: marca, linha, tipo, ativo e volume.",
      field: "name",
      label: "Titulo longo",
      severity: "critical"
    });
  }

  if (hasDuplicatedWords(sourceForIssues)) {
    issues.push({
      code: "duplicated-words",
      detail: "Remova palavras duplicadas no titulo.",
      field: "name",
      label: "Palavra duplicada",
      severity: "critical"
    });
  }

  const normalizedSource = normalizeForCompare(sourceForIssues);
  BLOCKED_CLAIM_TERMS.forEach((term) => {
    if (normalizedSource.includes(normalizeForCompare(term))) {
      issues.push({
        code: "claim-in-name",
        detail: `O titulo contem claim proibido: "${term}".`,
        field: "name",
        label: "Claim exagerado no titulo",
        severity: "critical"
      });
    }
  });

  const value = titleCase(removeConsecutiveDuplicatedWords(sourceForValue.replace(/[|*_~]+/g, "")));

  return {
    blocked: issues.some((issue) => issue.severity === "critical"),
    issues,
    original,
    value
  };
}
