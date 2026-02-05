import "server-only";

const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const assertEnv = (name: string) => getEnv(name);

export const getServerEnv = () => ({
  SUPABASE_SERVICE_ROLE_KEY: assertEnv("SUPABASE_SERVICE_ROLE_KEY")
});

export const getPublicEnvServer = () => ({
  NEXT_PUBLIC_SUPABASE_URL: assertEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
});
