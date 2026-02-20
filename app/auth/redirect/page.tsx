import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Audience = "customer" | "partner";
type Role = "client" | "partner" | "admin";

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

function normalizeRole(value: string | null | undefined): Role {
  if (value === "admin") return "admin";
  if (value === "partner" || value === "seller") return "partner";
  return "client";
}

export default async function AuthRedirectPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const audience = normalizeAudience(firstValue(params.audience));
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?tab=${audience}`);
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let resolvedRole = normalizeRole(profileRow?.role);

  if (!profileRow?.role) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    resolvedRole = normalizeRole(roleRow?.role);
  }

  if (resolvedRole === "admin") {
    redirect("/admin");
  }

  if (resolvedRole === "partner") {
    redirect("/parceiro");
  }

  if (audience === "partner") {
    redirect("/parceiro/onboarding?status=pending");
  }

  redirect("/conta");
}

