import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BelaCodeLandingCta = {
  scanHref: string;
  scanCtaLabel: string;
};

export async function resolveBelaCodeLandingCta(): Promise<BelaCodeLandingCta> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      return {
        scanHref: "/conta/skincare#belacode-scan",
        scanCtaLabel: "Iniciar leitura"
      };
    }
  } catch {
    // fallback publico
  }

  return {
    scanHref: "/login?tab=customer",
    scanCtaLabel: "Ver experiencia"
  };
}
