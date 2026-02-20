import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export default async function AccountDebugPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6">
        <p className="text-sm text-bpGraphite/70">Entre para ver o debug.</p>
      </div>
    );
  }

  const { user } = session;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">Debug</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Sessao atual</h1>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-semibold text-bpBlackSoft">User ID:</span>{" "}
            <code className="rounded bg-bpOffWhite px-2 py-1 text-[13px] text-bpBlackSoft">
              {user.id}
            </code>
          </p>
          <p>
            <span className="font-semibold text-bpBlackSoft">E-mail:</span>{" "}
            <code className="rounded bg-bpOffWhite px-2 py-1 text-[13px] text-bpBlackSoft">
              {user.email}
            </code>
          </p>
          <p>
            <span className="font-semibold text-bpBlackSoft">Role:</span>{" "}
            <code className="rounded bg-bpOffWhite px-2 py-1 text-[13px] text-bpBlackSoft">
              {roleRow?.role ?? "null"}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
