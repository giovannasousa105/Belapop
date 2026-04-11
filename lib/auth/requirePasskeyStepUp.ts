import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/server";
import { isRequirePasskeyPartnerEnabled } from "@/lib/admin/featureFlags";

type PortalRole = "client" | "partner" | "admin";

export async function requirePasskeyStepUp(params: {
  role: PortalRole;
  pathname: string;
}) {
  const { role, pathname } = params;
  if (role === "client") return;
  if (role === "partner") {
    const enabledForPartners = await isRequirePasskeyPartnerEnabled();
    if (!enabledForPartners) return;
  }

  const targetPath = pathname && pathname.startsWith("/") ? pathname : "/";
  if (targetPath.startsWith("/mfa")) return;

  const supabase = await createSupabaseServer();
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

  // Do not hard-block access when MFA factors are unavailable/misconfigured on project.
  if (factorsError) return;

  const hasVerifiedPasskey =
    factorsData?.all?.some(
      (factor) => factor.factor_type === "webauthn" && factor.status === "verified"
    ) ?? false;

  // Only enforce step-up for accounts that already enrolled a verified passkey.
  if (!hasVerifiedPasskey) return;

  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = data?.currentLevel ?? null;

  if (currentLevel !== "aal2") {
    redirect(`/mfa?next=${encodeURIComponent(targetPath)}`);
  }
}
