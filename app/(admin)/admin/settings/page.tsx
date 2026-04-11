import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { fetchAdminSettings } from "@/lib/admin/data";
import {
  readRequirePasskeyPartnerFlag,
  setRequirePasskeyPartnerFlag
} from "@/lib/admin/featureFlags";
import { requireRole } from "@/lib/auth/requireRole";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function updatePartnerPasskeyPolicy(formData: FormData) {
  "use server";

  await requireRole(["admin"], {
    redirectTo: "/admin/login"
  });

  const enabled = formData.get("require_passkey_partner") === "on";
  const result = await setRequirePasskeyPartnerFlag(enabled);

  if (!result.ok) {
    const message = encodeURIComponent(result.message ?? "Nao foi possivel salvar.");
    redirect(`/admin/settings?error=${message}`);
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const saved = firstValue(params.saved) === "1";
  const error = firstValue(params.error);

  const [settings, passkeyPolicy] = await Promise.all([
    fetchAdminSettings(),
    readRequirePasskeyPartnerFlag()
  ]);

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Configuracoes</p>
          <h1 className="font-display text-3xl text-bpBlack">Ajustes institucionais</h1>
          <p className="text-sm text-bpGraphite/80">
            Politicas de seguranca e parametros globais da operacao.
          </p>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Seguranca</p>
            <h2 className="mt-1 font-display text-xl text-bpBlack">
              Exigir Passkey para todos os parceiros
            </h2>
            <p className="mt-1 text-sm text-bpGraphite/80">
              Quando ativo, usuarios partner precisam validar Passkey (AAL2) para acessar
              os paineis `/parceiro` e `/seller`.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
              passkeyPolicy.enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {passkeyPolicy.enabled ? "Ativo" : "Inativo"}
          </span>
        </div>

        <form action={updatePartnerPasskeyPolicy} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-4">
            <input
              type="checkbox"
              name="require_passkey_partner"
              defaultChecked={passkeyPolicy.enabled}
              className="h-4 w-4 accent-bpPink"
            />
            <span className="text-sm text-bpBlackSoft">
              Habilitar obrigatoriedade de Passkey para parceiros
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-bpPink px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
            >
              Salvar politica
            </button>
            <p className="text-xs text-bpGraphite/70">
              Origem: {passkeyPolicy.source === "db" ? "Banco" : "Fallback"}
            </p>
          </div>
        </form>

        {!passkeyPolicy.available ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Tabela `admin_settings` nao encontrada. Rode a migration
            `supabase/migrations/20260303_0100_admin_settings_passkey_flags.sql`.
          </p>
        ) : null}
        {saved ? (
          <p className="mt-3 text-xs text-emerald-700">Politica salva com sucesso.</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-xs text-rose-700">{decodeURIComponent(error)}</p>
        ) : null}
      </SectionFrame>

      <SectionFrame>
        <div className="flex items-center justify-between">
          <p className="text-sm text-bpGraphite/80">
            Outras configuracoes registradas em banco.
          </p>
          <LuxuryButton variant="secondary" href="/admin/dashboard">
            Voltar ao dashboard
          </LuxuryButton>
        </div>
        <div className="mt-4 space-y-3">
          {settings.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F6D6E2] p-4"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
                  {row.key}
                </p>
                <p className="text-sm text-bpBlackSoft">{row.value}</p>
              </div>
            </div>
          ))}
          {settings.length === 0 && (
            <p className="text-sm text-bpGraphite/80">Nenhuma configuracao registrada.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}

