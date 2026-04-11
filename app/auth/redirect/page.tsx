import { redirect } from "next/navigation";

import { resolveUserRoleState, setActiveLegacyRole } from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Audience = "customer" | "partner";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeAudience(value: string | undefined): Audience {
  return value === "partner" ? "partner" : "customer";
}

export default async function AuthRedirectPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const audience = normalizeAudience(firstValue(params.audience));
  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdminClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?tab=${audience}&auth_error=1`);
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin
  });

  const hasCustomer = roleState.assignedRoles.includes("customer");
  const hasSeller = roleState.assignedRoles.includes("seller");
  const hasAdmin = roleState.assignedRoles.includes("admin");

  if (audience === "partner") {
    if (hasSeller) {
      await setActiveLegacyRole({ userId: user.id, role: "seller", admin });
      redirect("/parceiro");
    }

    if (hasAdmin) {
      await setActiveLegacyRole({ userId: user.id, role: "admin", admin });
      redirect("/adm");
    }

    if (hasCustomer) {
      await setActiveLegacyRole({ userId: user.id, role: "customer", admin });
      redirect("/parceiro/onboarding?status=pending");
    }

    redirect("/login?tab=partner&forbidden=1");
  }

  if (hasCustomer) {
    await setActiveLegacyRole({ userId: user.id, role: "customer", admin });
    redirect("/conta");
  }

  if (hasAdmin) {
    await setActiveLegacyRole({ userId: user.id, role: "admin", admin });
    redirect("/adm");
  }

  if (hasSeller) {
    await setActiveLegacyRole({ userId: user.id, role: "seller", admin });
    redirect("/parceiro");
  }

  redirect(`/login?tab=${audience}&forbidden=1`);
}
