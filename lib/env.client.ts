export const getPublicEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No client, nunca dar throw em runtime (quebra a Home inteira).
  // Em dev, loga para você ver; em prod, falha “suave”.
  if (!url || !anon) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[env] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local"
      );
    }
    return { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" };
  }

  return { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anon };
};
