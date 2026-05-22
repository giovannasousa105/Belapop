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
import { testConnection as testMandaBemConnection } from "@/lib/logistics/mandabem";
import {
  fetchLogisticsAdminSnapshot,
  readLogisticsRuntimeSettings,
  saveMandaBemConfiguration,
  updateMandaBemConnectionStatus
} from "@/lib/logistics/settings";
import { upsertManagedEnvVariable } from "@/lib/logistics/vercelEnv";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const hiddenSettingsKeys = new Set([
  "mandabem_token_encrypted",
  "mandabem_token_masked",
  "mandabem_status",
  "mandabem_last_checked_at",
  "mandabem_last_error",
  "mandabem_sandbox_mode",
  "mandabem_connected_at",
  "shipping_active_provider"
]);

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildSettingsRedirectQuery(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (!value) return;
    params.set(key, value);
  });
  return `/admin/settings?${params.toString()}`;
}

function statusClasses(status: string) {
  if (status === "connected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "invalid_token" || status === "auth_error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "error") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "connected") return "Conectado";
  if (status === "invalid_token") return "Token invalido";
  if (status === "auth_error") return "Erro de autenticacao";
  if (status === "error") return "Erro de conexao";
  return "Não configurado";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("pt-BR");
}

async function updatePartnerPasskeyPolicy(formData: FormData) {
  "use server";

  await requireRole(["admin"], {
    redirectTo: "/admin/login"
  });

  const enabled = formData.get("require_passkey_partner") === "on";
  const result = await setRequirePasskeyPartnerFlag(enabled);

  if (!result.ok) {
    redirect(
      buildSettingsRedirectQuery({
        error: result.message ?? "Não foi possivel salvar."
      })
    );
  }

  revalidatePath("/admin/settings");
  redirect(buildSettingsRedirectQuery({ saved: "1" }));
}

async function connectMandaBem(formData: FormData) {
  "use server";

  await requireRole(["admin"], {
    redirectTo: "/admin/login"
  });

  const token = String(formData.get("mandabem_api_token") ?? "").trim();
  const sandbox = formData.get("mandabem_sandbox_mode") === "on";

  if (!token) {
    redirect(
      buildSettingsRedirectQuery({
        mb_error: "Informe um API Token valido para conectar o Manda Bem.",
        mb_status: "not_configured"
      })
    );
  }

  const testResult = await testMandaBemConnection({
    tokenOverride: token,
    sandboxOverride: sandbox
  });

  if (!testResult.ok) {
    await updateMandaBemConnectionStatus({
      status: testResult.status,
      sandbox,
      lastError: testResult.message,
      token
    });

    revalidatePath("/admin/settings");
    redirect(
      buildSettingsRedirectQuery({
        mb_error: testResult.message,
        mb_status: testResult.status
      })
    );
  }

  const persisted = await saveMandaBemConfiguration({
    token,
    sandbox,
    status: "connected"
  });

  if (!persisted.ok) {
    redirect(
      buildSettingsRedirectQuery({
        mb_error: persisted.message ?? "Nao foi possivel salvar o Manda Bem.",
        mb_status: "error"
      })
    );
  }

  const [tokenEnv, sandboxEnv] = await Promise.all([
    upsertManagedEnvVariable("MANDABEM_API_TOKEN", token),
    upsertManagedEnvVariable("MANDABEM_SANDBOX_MODE", sandbox ? "1" : "0")
  ]);

  revalidatePath("/admin/settings");
  revalidatePath("/admin/frete-logistica");

  const note = [tokenEnv, sandboxEnv]
    .filter((result) => !result.ok && result.message)
    .map((result) => result.message)
    .join(" ");

  redirect(
    buildSettingsRedirectQuery({
      mb_saved: "1",
      mb_status: "connected",
      mb_note: note || undefined
    })
  );
}

async function testMandaBem(formData: FormData) {
  "use server";

  await requireRole(["admin"], {
    redirectTo: "/admin/login"
  });

  const token = String(formData.get("mandabem_api_token") ?? "").trim();
  const sandbox = formData.get("mandabem_sandbox_mode") === "on";

  const result = await testMandaBemConnection({
    tokenOverride: token || undefined,
    sandboxOverride: sandbox
  });

  await updateMandaBemConnectionStatus({
    status: result.status,
    sandbox,
    lastError: result.ok ? null : result.message,
    token: token || null
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/frete-logistica");

  redirect(
    buildSettingsRedirectQuery({
      mb_tested: "1",
      mb_status: result.status,
      mb_error: result.ok ? undefined : result.message
    })
  );
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const saved = firstValue(params.saved) === "1";
  const error = firstValue(params.error);
  const mbSaved = firstValue(params.mb_saved) === "1";
  const mbTested = firstValue(params.mb_tested) === "1";
  const mbStatusQuery = firstValue(params.mb_status);
  const mbError = firstValue(params.mb_error);
  const mbNote = firstValue(params.mb_note);

  const [settings, passkeyPolicy, logisticsRuntime, logisticsSnapshot] = await Promise.all([
    fetchAdminSettings(),
    readRequirePasskeyPartnerFlag(),
    readLogisticsRuntimeSettings(),
    fetchLogisticsAdminSnapshot()
  ]);

  const runtimeStatus = mbStatusQuery ?? logisticsRuntime.mandabem.status;
  const visibleSettings = settings.filter((row) => !hiddenSettingsKeys.has(row.key));

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Configuracoes</p>
          <h1 className="font-display text-3xl text-bpBlack">Ajustes institucionais</h1>
          <p className="text-sm text-bpGraphite/80">
            Politicas de seguranca, hubs logisticos e parametros globais da operacao.
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
          <p className="mt-3 text-xs text-rose-700">{error}</p>
        ) : null}
      </SectionFrame>

      <SectionFrame>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
              Logistica / Manda Bem
            </p>
            <h2 className="font-display text-2xl text-bpBlack">Hub logistico principal</h2>
            <p className="max-w-3xl text-sm text-bpGraphite/80">
              Configure o token do Manda Bem com seguranca. Toda chamada passa apenas
              pelo backend e o checkout consome cotacoes do provider ativo.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${statusClasses(
              runtimeStatus
            )}`}
          >
            {statusLabel(runtimeStatus)}
          </span>
        </div>

        <form className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="mandabem_api_token"
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bpGraphite/75"
                >
                  API Token
                </label>
                <input
                  id="mandabem_api_token"
                  name="mandabem_api_token"
                  type="password"
                  autoComplete="off"
                  placeholder={logisticsRuntime.mandabem.tokenMasked ?? "Cole o token do Manda Bem"}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus-visible:border-bpPink/50"
                />
                <p className="text-xs text-bpGraphite/70">
                  Token usado apenas no backend. Nunca exposto no frontend nem salvo em
                  localStorage.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-4">
                <input
                  type="checkbox"
                  name="mandabem_sandbox_mode"
                  defaultChecked={logisticsRuntime.mandabem.sandbox}
                  className="h-4 w-4 accent-bpPink"
                />
                <div className="space-y-1">
                  <span className="block text-sm text-bpBlackSoft">Ativar sandbox</span>
                  <span className="block text-xs text-bpGraphite/70">
                    Mantem cotacoes e envios em modo de teste sem afetar pedidos reais.
                  </span>
                </div>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  formAction={connectMandaBem}
                  className="rounded-full bg-bpPink px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
                >
                  Conectar Manda Bem
                </button>
                <button
                  formAction={testMandaBem}
                  className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlack"
                >
                  Testar conexao
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#F6D6E2] bg-[#FFF8FB] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bpGraphite/75">
                Estado atual
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bpGraphite/70">Provider ativo</dt>
                  <dd className="font-medium text-bpBlack">{logisticsRuntime.activeProvider}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bpGraphite/70">Token</dt>
                  <dd className="font-medium text-bpBlack">
                    {logisticsRuntime.mandabem.tokenMasked ?? "Não configurado"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bpGraphite/70">Origem do secret</dt>
                  <dd className="font-medium text-bpBlack">
                    {logisticsRuntime.mandabem.tokenSource === "env"
                      ? "Ambiente"
                      : logisticsRuntime.mandabem.tokenSource === "encrypted_setting"
                        ? "Cofre server-side"
                        : "Indisponivel"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bpGraphite/70">Ultimo teste</dt>
                  <dd className="font-medium text-bpBlack">
                    {formatDateTime(logisticsRuntime.mandabem.lastCheckedAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bpGraphite/70">Sandbox</dt>
                  <dd className="font-medium text-bpBlack">
                    {logisticsRuntime.mandabem.sandbox ? "Ativo" : "Inativo"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </form>

        {mbSaved ? (
          <p className="mt-4 text-xs text-emerald-700">Manda Bem conectado com sucesso.</p>
        ) : null}
        {mbTested ? (
          <p className="mt-4 text-xs text-bpGraphite/80">
            Conexao do Manda Bem testada em {formatDateTime(logisticsRuntime.mandabem.lastCheckedAt)}.
          </p>
        ) : null}
        {mbNote ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {mbNote}
          </p>
        ) : null}
        {mbError ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {mbError}
          </p>
        ) : null}
        {logisticsRuntime.mandabem.lastError && !mbError ? (
          <p className="mt-3 text-xs text-bpGraphite/70">
            Ultimo retorno: {logisticsRuntime.mandabem.lastError}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Pedidos sincronizados
            </p>
            <p className="mt-3 font-display text-3xl text-bpBlack">
              {logisticsSnapshot.metrics.syncedOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Etiquetas geradas
            </p>
            <p className="mt-3 font-display text-3xl text-bpBlack">
              {logisticsSnapshot.metrics.labelsGenerated}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Rastreios ativos
            </p>
            <p className="mt-3 font-display text-3xl text-bpBlack">
              {logisticsSnapshot.metrics.trackedShipments}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bpGraphite/75">
              Status logistico
            </p>
            <div className="mt-4 space-y-3">
              {logisticsSnapshot.statusBreakdown.length > 0 ? (
                logisticsSnapshot.statusBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm"
                  >
                    <span className="text-bpBlackSoft">{item.status}</span>
                    <span className="font-medium text-bpBlack">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-bpGraphite/70">Nenhum envio sincronizado ainda.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bpGraphite/75">
                Envios recentes
              </p>
              <LuxuryButton variant="secondary" href="/admin/frete-logistica">
                Ver painel logistico
              </LuxuryButton>
            </div>
            <div className="mt-4 space-y-3">
              {logisticsSnapshot.recentShipments.length > 0 ? (
                logisticsSnapshot.recentShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="rounded-2xl border border-[#F6D6E2] p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-bpBlack">
                        Pedido {shipment.orderId.slice(0, 8)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-bpGraphite/70">
                        {shipment.status ?? "sem status"}
                      </span>
                    </div>
                    <p className="mt-2 text-bpGraphite/75">
                      {shipment.carrier ?? "Transportadora"} •{" "}
                      {shipment.trackingCode ?? "Sem rastreio"}
                    </p>
                    <p className="mt-1 text-xs text-bpGraphite/65">
                      Atualizado em {formatDateTime(shipment.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-bpGraphite/70">
                  Nenhum envio recente para monitorar.
                </p>
              )}
            </div>
          </div>
        </div>
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
          {visibleSettings.map((row) => (
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
          {visibleSettings.length === 0 && (
            <p className="text-sm text-bpGraphite/80">Nenhuma configuracao registrada.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}
