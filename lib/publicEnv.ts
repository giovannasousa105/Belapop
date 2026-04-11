export function sanitizePublicEnvValue(value?: string | null) {
  if (!value) return "";

  let sanitized = value.trim();
  if (sanitized.startsWith('"') && sanitized.endsWith('"') && sanitized.length >= 2) {
    sanitized = sanitized.slice(1, -1).trim();
  }

  return sanitized.replace(/\\r\\n|\\n|\\r/g, "").trim();
}

export function getPublicUrl(value: string | undefined | null, fallback: string) {
  return sanitizePublicEnvValue(value) || fallback;
}

export function getPublicAsset(value: string | undefined | null, fallback: string) {
  return sanitizePublicEnvValue(value) || fallback;
}
