"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPrice } from "@/lib/utils";
import type { AdminCampaign } from "@/lib/admin/campaignService";

type CampaignsManagerProps = {
  initialCampaigns: AdminCampaign[];
};

type CreateState = {
  code: string;
  discountMode: "percent" | "amount";
  discountValue: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
};

const defaultForm: CreateState = {
  code: "",
  discountMode: "percent",
  discountValue: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: ""
};

const formatDiscount = (campaign: AdminCampaign) => {
  if (campaign.percentOff && campaign.percentOff > 0) {
    return `${campaign.percentOff}% OFF`;
  }
  if (campaign.amountOffCents && campaign.amountOffCents > 0) {
    return `${formatPrice(campaign.amountOffCents / 100)} OFF`;
  }
  return "Sem desconto";
};

const formatWindow = (campaign: AdminCampaign) => {
  const start = campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString("pt-BR") : "Imediato";
  const end = campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("pt-BR") : "Sem fim";
  return `${start} - ${end}`;
};

export default function CampaignsManager({ initialCampaigns }: CampaignsManagerProps) {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>(initialCampaigns);
  const [form, setForm] = useState<CreateState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = useMemo(
    () => campaigns.filter((campaign) => campaign.status === "active").length,
    [campaigns]
  );

  const scheduledCount = useMemo(
    () => campaigns.filter((campaign) => campaign.status === "scheduled").length,
    [campaigns]
  );

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      code: form.code.trim(),
      discountMode: form.discountMode,
      discountValue: Number(form.discountValue || 0),
      minSubtotal: Number(form.minSubtotal || 0),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null
    };

    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoading(false);
      setMessage(json?.error ?? "Nao foi possivel criar a campanha.");
      return;
    }

    const created = json?.campaign as AdminCampaign | undefined;
    if (created) {
      setCampaigns((prev) => [created, ...prev]);
    }
    setForm(defaultForm);
    setLoading(false);
    setMessage("Campanha criada com sucesso.");
  };

  const handleToggle = async (campaign: AdminCampaign) => {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/admin/coupons/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !campaign.isActive })
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoading(false);
      setMessage(json?.error ?? "Nao foi possivel atualizar a campanha.");
      return;
    }

    const updated = json?.campaign as AdminCampaign | undefined;
    if (updated) {
      setCampaigns((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Nova campanha</p>
        <h2 className="mt-2 font-display text-2xl text-bpBlack">Criar anuncio promocional</h2>
        <p className="mt-1 text-sm text-bpGraphite/80">
          Configure codigo, desconto, janela de vigencia e publico via pedido minimo.
        </p>

        <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70 sm:col-span-2">
            Codigo da campanha
            <input
              required
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              placeholder="EX: BELA10"
              className="rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
            Tipo de desconto
            <select
              value={form.discountMode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, discountMode: event.target.value as "percent" | "amount" }))
              }
              className="rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
            >
              <option value="percent">Percentual (%)</option>
              <option value="amount">Valor fixo (R$)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
            Valor do desconto
            <input
              required
              type="number"
              min={0}
              step={form.discountMode === "percent" ? 1 : 0.01}
              value={form.discountValue}
              onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))}
              placeholder={form.discountMode === "percent" ? "10" : "15.90"}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
            Pedido minimo (R$)
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.minSubtotal}
              onChange={(event) => setForm((prev) => ({ ...prev, minSubtotal: event.target.value }))}
              placeholder="0.00"
              className="rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
            Inicio
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
            Fim
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
            />
          </label>

          <button
            disabled={loading}
            type="submit"
            className="rounded-full bg-bpPink px-5 py-3 text-xs uppercase tracking-[0.28em] text-white transition hover:brightness-110 disabled:opacity-60 sm:col-span-2"
          >
            {loading ? "Salvando..." : "Criar campanha"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-bpGraphite/80">{message}</p> : null}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Campanhas ativas</p>
            <h2 className="mt-2 font-display text-2xl text-bpBlack">
              {campaigns.length.toLocaleString("pt-BR")}
            </h2>
          </div>
          <div className="text-right text-xs text-bpGraphite/70">
            <p>Ativas: {activeCount}</p>
            <p>Agendadas: {scheduledCount}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-xl border border-black/10 bg-bpOffWhite px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-bpBlackSoft">{campaign.code}</p>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="mt-1 text-xs text-bpGraphite/80">{formatDiscount(campaign)}</p>
              <p className="text-xs text-bpGraphite/70">Vigencia: {formatWindow(campaign)}</p>
              <p className="text-xs text-bpGraphite/70">
                Minimo: {formatPrice((campaign.minSubtotalCents ?? 0) / 100)}
              </p>
              <button
                type="button"
                onClick={() => handleToggle(campaign)}
                disabled={loading}
                className="mt-2 rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-bpBlackSoft hover:border-bpPink/50 disabled:opacity-60"
              >
                {campaign.isActive ? "Pausar" : "Ativar"}
              </button>
            </div>
          ))}
          {campaigns.length === 0 && (
            <p className="text-sm text-bpGraphite/70">Nenhuma campanha cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
