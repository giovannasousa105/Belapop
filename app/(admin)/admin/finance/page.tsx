import { headers } from "next/headers";

import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { MoneySummaryCard } from "@/components/admin/dashboard/MoneySummaryCard";
import { formatPrice } from "@/lib/utils";

type PayoutRow = {
  id: string;
  status: string;
  amount_cents: number;
  holdback_cents?: number;
  net_after_holdback_cents?: number;
  scheduled_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  source?: string;
};

type FinanceData = {
  receivable?: number;
  nextPayout?: string | null;
  fees?: number;
  payouts?: PayoutRow[];
  summary?: {
    payout?: {
      source?: string;
      batches?: number;
      paid_cents?: number;
      scheduled_cents?: number;
      blocked_cents?: number;
      next_payout_at?: string | null;
    };
    risk?: {
      sellers_total?: number;
      avg_risk_score?: number;
      high_risk_sellers?: number;
      restricted_sellers?: number;
      blocked_payout_sellers?: number;
      active_holdbacks?: number;
      active_holdback_cents?: number;
    };
    reconciliation?: {
      latest_recon_date?: string | null;
      latest_providers?: number;
      latest_status_counts?: { ok?: number; warn?: number; critical?: number };
      latest_delta_abs_total_cents?: number;
      warn_runs_lookback?: number;
      critical_runs_lookback?: number;
    };
    ops_alerts?: {
      open_total_7d?: number;
      critical_open_7d?: number;
      top_types?: Array<{ alert_type: string; count: number }>;
    };
    ledger?: {
      dedicated_filters?: Array<{ entry_type: string; count: number }>;
      active_entry_type_filter?: string | null;
    };
    drilldown?: {
      risk?: {
        blocked_sellers?: number;
        top_sellers?: Array<{
          seller_id: string | null;
          risk_score: number;
          risk_tier: string;
          payouts_blocked: boolean;
          holdback_bps: number;
          device_risk_30d: number;
          velocity_risk_30d: number;
          orders_30d: number;
          computed_at: string | null;
        }>;
      };
      payouts?: {
        blocked_batches?: Array<{
          payout_id: string;
          seller_id: string | null;
          risk_tier: string | null;
          holdback_bps: number;
          gross_payout_cents: number;
          holdback_cents: number;
          net_after_holdback_cents: number;
          updated_at: string | null;
        }>;
        released_holdbacks_7d?: Array<{
          holdback_id: string | null;
          seller_id: string | null;
          seller_payout_id: string | null;
          reason: string | null;
          holdback_cents: number;
          released_at: string | null;
        }>;
      };
      reconciliation?: {
        providers_latest?: Array<{
          provider: string;
          status: string;
          cash_delta_cents: number;
          ledger_net_delta_cents: number;
          payout_delta_cents: number;
          max_abs_delta_cents: number;
          computed_at: string | null;
        }>;
        critical_providers_latest?: Array<{
          provider: string;
          status: string;
          cash_delta_cents: number;
          ledger_net_delta_cents: number;
          payout_delta_cents: number;
          max_abs_delta_cents: number;
          computed_at: string | null;
        }>;
        critical_provider_alerts_open?: Array<{
          id: string | null;
          provider: string | null;
          recon_date: string | null;
          title: string | null;
          body: string | null;
          severity: string;
          created_at: string | null;
        }>;
        issues?: Array<{
          id: string | null;
          report_id: string | null;
          provider: string;
          order_id: string | null;
          seller_id: string | null;
          seller_order_id: string | null;
          payment_intent_id: string | null;
          issue_type: string | null;
          expected_amount: number;
          actual_amount: number;
          status: string;
          details: Record<string, unknown>;
          created_at: string | null;
          resolved_at: string | null;
        }>;
      };
      ledger?: {
        recent_entries?: Array<{
          id: string | null;
          order_id: string | null;
          seller_id: string | null;
          user_id: string | null;
          entry_type: string | null;
          amount: number;
          currency: string;
          reference_id: string | null;
          reference_type: string | null;
          account_code: string | null;
          direction: string | null;
          description: string | null;
          created_at: string | null;
        }>;
        recent_transactions?: Array<{
          id: string | null;
          transaction_type: string | null;
          seller_id: string | null;
          order_id: string | null;
          user_id: string | null;
          payout_id: string | null;
          reference_type: string | null;
          reference_id: string | null;
          created_by: string | null;
          status: string;
          created_at: string | null;
          lines_count: number;
          total_debit_cents: number;
          total_credit_cents: number;
        }>;
      };
    };
  };
};

const centsToBrl = (value: unknown) => Number(value ?? 0) / 100;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatRiskRate = (value: number) => `${(Math.max(0, value) * 100).toFixed(2)}%`;

async function getFinance(entryType?: string | null) {
  const incoming = await headers();
  const forwardedProto = incoming.get("x-forwarded-proto") ?? "https";
  const forwardedHost = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const baseUrl = `${forwardedProto}://${forwardedHost}`;
  const cookie = incoming.get("cookie") ?? "";
  const url = new URL("/api/admin/finance", baseUrl);
  if (entryType) {
    url.searchParams.set("entryType", entryType);
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined
  });

  if (!res.ok) {
    return {
      receivable: 0,
      nextPayout: null,
      fees: 0,
      payouts: []
    } as FinanceData;
  }

  return (await res.json()) as FinanceData;
}

type FinancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const normalizeEntryFilter = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "commission_reversal" || raw === "chargeback_fee") return raw;
  return null;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const entryTypeFilter = normalizeEntryFilter(resolvedSearchParams.entryType);
  const data = await getFinance(entryTypeFilter);

  const receivableCents = Number(data.receivable ?? 0);
  const feesCents = Number(data.fees ?? 0);
  const nextPayoutAt = data.summary?.payout?.next_payout_at ?? data.nextPayout ?? null;
  const holdbackActiveCents = Number(data.summary?.risk?.active_holdback_cents ?? 0);
  const highRiskSellers = Number(data.summary?.risk?.high_risk_sellers ?? 0);
  const criticalOpsAlerts = Number(data.summary?.ops_alerts?.critical_open_7d ?? 0);
  const latestReconStatus = data.summary?.reconciliation?.latest_status_counts;
  const topRiskSellers = data.summary?.drilldown?.risk?.top_sellers ?? [];
  const blockedPayoutBatches = data.summary?.drilldown?.payouts?.blocked_batches ?? [];
  const releasedHoldbacks7d = data.summary?.drilldown?.payouts?.released_holdbacks_7d ?? [];
  const providersLatest = data.summary?.drilldown?.reconciliation?.providers_latest ?? [];
  const criticalProviderAlerts =
    data.summary?.drilldown?.reconciliation?.critical_provider_alerts_open ?? [];
  const dedicatedLedgerFilters = data.summary?.ledger?.dedicated_filters ?? [];
  const activeLedgerFilter = data.summary?.ledger?.active_entry_type_filter ?? null;
  const ledgerEntries = data.summary?.drilldown?.ledger?.recent_entries ?? [];
  const ledgerTransactions = data.summary?.drilldown?.ledger?.recent_transactions ?? [];
  const reconLabel = latestReconStatus
    ? latestReconStatus.critical && latestReconStatus.critical > 0
      ? "CRITICAL"
      : latestReconStatus.warn && latestReconStatus.warn > 0
        ? "WARN"
        : "OK"
    : "N/A";

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Financeiro</p>
            <h1 className="font-display text-3xl text-bpBlack">Repasses, risco e reconciliação</h1>
            <p className="text-sm text-bpGraphite/80">
              Visão operacional de caixa, holdbacks, antifraude e reconciliação T+1.
            </p>
          </div>
          <div className="rounded-full border border-black/10 bg-bpOffWhite/80 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-bpGraphite/70">
            Exportacao administrativa sera habilitada com extrato consolidado
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MoneySummaryCard
            title="A receber"
            amount={formatPrice(centsToBrl(receivableCents))}
            badge="Hoje"
          />
          <MoneySummaryCard
            title="Próximo repasse"
            amount={formatDateTime(nextPayoutAt)}
            subtitle={formatPrice(centsToBrl(data.summary?.payout?.scheduled_cents ?? 0))}
          />
          <MoneySummaryCard
            title="Holdback ativo"
            amount={formatPrice(centsToBrl(holdbackActiveCents))}
            subtitle={`${Number(data.summary?.risk?.active_holdbacks ?? 0).toLocaleString("pt-BR")} retenções abertas`}
          />
          <MoneySummaryCard
            title="Sellers alto risco"
            amount={highRiskSellers.toLocaleString("pt-BR")}
            subtitle={`${Number(data.summary?.risk?.restricted_sellers ?? 0).toLocaleString("pt-BR")} restritos`}
          />
          <MoneySummaryCard
            title="Reconciliação T+1"
            amount={reconLabel}
            subtitle={
              data.summary?.reconciliation?.latest_recon_date
                ? `Data: ${data.summary.reconciliation.latest_recon_date}`
                : "Sem execução"
            }
          />
          <MoneySummaryCard
            title="Alertas críticos (7d)"
            amount={criticalOpsAlerts.toLocaleString("pt-BR")}
            subtitle={`${Number(data.summary?.ops_alerts?.open_total_7d ?? 0).toLocaleString("pt-BR")} alertas abertos`}
          />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Agenda</p>
            <h2 className="font-display text-xl text-bpBlack">Lotes de payout</h2>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(data.payouts ?? []).map((payout) => (
            <div
              key={payout.id ?? `${payout.created_at ?? "payout"}-${payout.amount_cents ?? 0}`}
              className="flex items-center justify-between rounded-2xl border border-black/10 bg-bpOffWhite px-3 py-2"
            >
              <div className="text-sm text-bpBlackSoft">{formatDateTime(payout.scheduled_at ?? payout.created_at)}</div>
              <div className="text-sm font-semibold text-bpBlackSoft">
                {formatPrice(centsToBrl(payout.amount_cents ?? 0))}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{payout.status ?? "--"}</div>
            </div>
          ))}

          {(data.payouts ?? []).length === 0 ? (
            <p className="text-sm text-bpGraphite/70">Nenhum payout disponível no período.</p>
          ) : null}
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Risco antifraude</p>
            <p className="mt-2 text-sm text-bpBlackSoft">
              Score médio: <strong>{Number(data.summary?.risk?.avg_risk_score ?? 0).toLocaleString("pt-BR")}</strong>
            </p>
            <p className="text-sm text-bpBlackSoft">
              Sellers com payout bloqueado: <strong>{Number(data.summary?.risk?.blocked_payout_sellers ?? 0).toLocaleString("pt-BR")}</strong>
            </p>
          </article>

          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Reconciliação T+1</p>
            <p className="mt-2 text-sm text-bpBlackSoft">
              Delta absoluto (última data): <strong>{formatPrice(centsToBrl(data.summary?.reconciliation?.latest_delta_abs_total_cents ?? 0))}</strong>
            </p>
            <p className="text-sm text-bpBlackSoft">
              Warn/Critical (lookback):{" "}
              <strong>
                {Number(data.summary?.reconciliation?.warn_runs_lookback ?? 0).toLocaleString("pt-BR")}/{Number(
                  data.summary?.reconciliation?.critical_runs_lookback ?? 0
                ).toLocaleString("pt-BR")}
              </strong>
            </p>
          </article>
        </div>

        {(data.summary?.ops_alerts?.top_types ?? []).length > 0 ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Top alertas abertos (7d)</p>
            <div className="mt-2 space-y-1 text-sm text-bpBlackSoft">
              {(data.summary?.ops_alerts?.top_types ?? []).slice(0, 6).map((row) => (
                <p key={row.alert_type}>
                  {row.alert_type}: <strong>{row.count.toLocaleString("pt-BR")}</strong>
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-4 text-sm text-bpGraphite/70">
          Taxas estimadas: {formatPrice(centsToBrl(feesCents))}
        </p>
      </SectionFrame>

      <SectionFrame>
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Top risco (device/velocity)</p>
            <div className="mt-3 space-y-2 text-sm text-bpBlackSoft">
              {topRiskSellers.slice(0, 8).map((row) => (
                <div key={`${row.seller_id}-${row.computed_at}`} className="rounded-xl border border-black/10 p-3">
                  <p className="font-semibold text-bpBlack">Seller {row.seller_id ?? "--"}</p>
                  <p>
                    Score {row.risk_score.toLocaleString("pt-BR")} • Tier {row.risk_tier} • Holdback{" "}
                    {row.holdback_bps.toLocaleString("pt-BR")} bps
                  </p>
                  <p>
                    Device {formatRiskRate(row.device_risk_30d)} • Velocity{" "}
                    {formatRiskRate(row.velocity_risk_30d)} • Orders 30d{" "}
                    {row.orders_30d.toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
              {topRiskSellers.length === 0 ? (
                <p className="text-bpGraphite/70">Sem sellers em risco para o período.</p>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Payouts bloqueados e releases</p>
            <div className="mt-3 space-y-2 text-sm text-bpBlackSoft">
              {blockedPayoutBatches.slice(0, 6).map((row) => (
                <div key={row.payout_id} className="rounded-xl border border-black/10 p-3">
                  <p className="font-semibold text-bpBlack">Payout {row.payout_id}</p>
                  <p>
                    Seller {row.seller_id ?? "--"} • Tier {row.risk_tier ?? "--"} • Holdback{" "}
                    {row.holdback_bps.toLocaleString("pt-BR")} bps
                  </p>
                  <p>
                    Bruto {formatPrice(centsToBrl(row.gross_payout_cents))} • Retido{" "}
                    {formatPrice(centsToBrl(row.holdback_cents))} • Líquido{" "}
                    {formatPrice(centsToBrl(row.net_after_holdback_cents))}
                  </p>
                </div>
              ))}
              {blockedPayoutBatches.length === 0 ? (
                <p className="text-bpGraphite/70">Nenhum payout bloqueado no momento.</p>
              ) : null}
            </div>
            <div className="mt-4 border-t border-black/10 pt-3 text-sm text-bpBlackSoft">
              <p className="font-semibold text-bpBlack">Releases (7d)</p>
              {releasedHoldbacks7d.slice(0, 5).map((row) => (
                <p key={row.holdback_id ?? `${row.seller_id}-${row.released_at}`}>
                  Seller {row.seller_id ?? "--"} • {formatPrice(centsToBrl(row.holdback_cents))} •{" "}
                  {formatDateTime(row.released_at)}
                </p>
              ))}
              {releasedHoldbacks7d.length === 0 ? (
                <p className="text-bpGraphite/70">Sem holdbacks liberados nos últimos 7 dias.</p>
              ) : null}
            </div>
          </article>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">
              Reconciliação por provider (última data)
            </p>
            <div className="mt-3 space-y-2 text-sm text-bpBlackSoft">
              {providersLatest.slice(0, 10).map((row) => (
                <div key={`${row.provider}-${row.computed_at}`} className="rounded-xl border border-black/10 p-3">
                  <p className="font-semibold text-bpBlack">
                    {row.provider} • {row.status.toUpperCase()}
                  </p>
                  <p>
                    max|delta| {formatPrice(centsToBrl(row.max_abs_delta_cents))} • cash/gross{" "}
                    {formatPrice(centsToBrl(row.cash_delta_cents))}
                  </p>
                  <p>
                    ledger/net {formatPrice(centsToBrl(row.ledger_net_delta_cents))} • payout/cash_out{" "}
                    {formatPrice(centsToBrl(row.payout_delta_cents))}
                  </p>
                </div>
              ))}
              {providersLatest.length === 0 ? (
                <p className="text-bpGraphite/70">Sem runs de reconciliação na última data.</p>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">
              Alertas críticos por provider (abertos)
            </p>
            <div className="mt-3 space-y-2 text-sm text-bpBlackSoft">
              {criticalProviderAlerts.slice(0, 10).map((row) => (
                <div key={row.id ?? `${row.provider}-${row.created_at}`} className="rounded-xl border border-black/10 p-3">
                  <p className="font-semibold text-bpBlack">
                    {row.provider ?? "unknown"} • {row.severity.toUpperCase()}
                  </p>
                  <p>{row.title ?? "Alerta crítico"}</p>
                  <p>
                    Recon date {row.recon_date ?? "--"} • {formatDateTime(row.created_at)}
                  </p>
                </div>
              ))}
              {criticalProviderAlerts.length === 0 ? (
                <p className="text-bpGraphite/70">Sem alertas críticos por provider abertos no período.</p>
              ) : null}
            </div>
          </article>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Ledger drill-down</p>
            <h2 className="font-display text-xl text-bpBlack">Commission reversal e chargeback fee</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <LuxuryButton
              tone="retail"
              variant={activeLedgerFilter ? "outline" : "secondary"}
              href="/admin/finance"
            >
              Todos
            </LuxuryButton>
            {dedicatedLedgerFilters.map((filter) => (
              <LuxuryButton
                key={filter.entry_type}
                tone="retail"
                variant={activeLedgerFilter === filter.entry_type ? "secondary" : "outline"}
                href={`/admin/finance?entryType=${filter.entry_type}`}
              >
                {filter.entry_type} ({filter.count.toLocaleString("pt-BR")})
              </LuxuryButton>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Lancamentos recentes</p>
            <div className="mt-3 space-y-2 text-sm text-bpBlackSoft">
              {ledgerEntries.slice(0, 12).map((row) => (
                <div key={row.id ?? `${row.reference_id}-${row.created_at}`} className="rounded-xl border border-black/10 p-3">
                  <p className="font-semibold text-bpBlack">
                    {row.entry_type ?? "ledger_entry"} • {formatPrice(row.amount)}
                  </p>
                  <p>
                    Conta {row.account_code ?? "--"} • {row.direction ?? "--"} • seller {row.seller_id ?? "--"}
                  </p>
                  <p>
                    order {row.order_id ?? "--"} • ref {row.reference_type ?? "--"} • {formatDateTime(row.created_at)}
                  </p>
                </div>
              ))}
              {ledgerEntries.length === 0 ? (
                <p className="text-bpGraphite/70">Nenhum lancamento encontrado para o filtro atual.</p>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">Journals relacionados</p>
            <div className="mt-3 space-y-2 text-sm text-bpBlackSoft">
              {ledgerTransactions.slice(0, 12).map((row) => (
                <div key={row.id ?? `${row.reference_id}-${row.created_at}`} className="rounded-xl border border-black/10 p-3">
                  <p className="font-semibold text-bpBlack">
                    {row.transaction_type ?? row.reference_type ?? "ledger_transaction"}
                  </p>
                  <p>
                    debito {formatPrice(centsToBrl(row.total_debit_cents))} • credito {formatPrice(centsToBrl(row.total_credit_cents))}
                  </p>
                  <p>
                    order {row.order_id ?? "--"} • ref {row.reference_type ?? "--"} • {formatDateTime(row.created_at)}
                  </p>
                </div>
              ))}
              {ledgerTransactions.length === 0 ? (
                <p className="text-bpGraphite/70">Nenhum journal encontrado para o filtro atual.</p>
              ) : null}
            </div>
          </article>
        </div>
      </SectionFrame>
    </div>
  );
}
