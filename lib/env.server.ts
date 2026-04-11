import "server-only";

const sanitizeEnvValue = (value: string) => {
  let sanitized = value.trim();
  if (sanitized.startsWith('"') && sanitized.endsWith('"') && sanitized.length >= 2) {
    sanitized = sanitized.slice(1, -1).trim();
  }
  // Handle badly formatted env values copied with escaped newlines.
  sanitized = sanitized.replace(/\\r\\n|\\n|\\r/g, "").trim();
  return sanitized;
};

const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  const sanitized = sanitizeEnvValue(value);
  if (!sanitized) throw new Error(`Missing required environment variable: ${name}`);
  return sanitized;
};

export const assertEnv = (name: string) => getEnv(name);

export const getServerEnv = () => ({
  SUPABASE_SERVICE_ROLE_KEY: assertEnv("SUPABASE_SERVICE_ROLE_KEY")
});

export const getPublicEnvServer = () => ({
  NEXT_PUBLIC_SUPABASE_URL: assertEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
});
