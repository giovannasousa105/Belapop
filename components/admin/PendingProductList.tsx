"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { formatPrice } from "@/lib/utils";
import { AdminPendingProductRow } from "@/lib/admin/productService";

const filterOptions = [
  { label: "Todos", value: "all" },
  { label: "Aguardando curadoria", value: "review" },
  { label: "Ajustes solicitados", value: "needs_adjustment" }
] as const;

async function approveProduct(id: string) {
  return fetch(`/api/admin/products/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
}

async function requestAdjustment(id: string, notes: string, reasons: string[]) {
  return fetch(`/api/admin/products/${id}/needs-adjustment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, reasons })
  });
}

async function rejectProduct(id: string, reason: string) {
  return fetch(`/api/admin/products/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: reason })
  });
}

type PendingListProps = { products: AdminPendingProductRow[] };

export default function PendingProductList({ products }: PendingListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<typeof filterOptions[number]["value"]>("review");
  const counts = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        if (product.status === "review") acc.review += 1;
        if (product.status === "needs_adjustment") acc.needsAdjustment += 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, review: 0, needsAdjustment: 0 }
    );
  }, [products]);

  const filterCount = (value: (typeof filterOptions)[number]["value"]) => {
    if (value === "all") return counts.total;
    if (value === "review") return counts.review;
    return counts.needsAdjustment;
  };

  const filtered = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((product) => product.status === filter);
  }, [filter, products]);

  const handleApprove = async (id: string) => {
    await approveProduct(id);
    router.refresh();
  };

  const handleNeedsAdjustment = async (id: string) => {
    const notesPrompt = window.prompt("Informe o que precisa ser ajustado:");
    if (!notesPrompt) return;
    const notes = notesPrompt.trim();
    if (!notes) return;
    const reasonsRaw = window.prompt("Motivos (separados por vírgula) para registro:");
    const reasons = reasonsRaw
      ? reasonsRaw
          .split(",")
          .map((reason) => reason.trim())
          .filter(Boolean)
      : [];
    await requestAdjustment(id, notes, reasons);
    router.refresh();
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Informe o motivo da reprovação editorial:");
    if (!reason) return;
    await rejectProduct(id, reason);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">Total</p>
          <p className="font-display text-3xl text-bpBlack">{counts.total}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">Aguardando curadoria</p>
          <p className="font-display text-3xl text-bpBlack">{counts.review}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">Ajustes solicitados</p>
          <p className="font-display text-3xl text-bpBlack">{counts.needsAdjustment}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              filter === option.value
                ? "border-bpPink/70 bg-bpPinkSoft/40 text-bpBlackSoft"
                : "border-black/10 text-bpGraphite/80 hover:border-bpPink/40 hover:text-bpBlackSoft"
            }`}
          >
            {option.label} ({filterCount(option.value)})
          </button>
        ))}
      </div>
      {filtered.map((product) => (
        <div
          key={product.id}
          className="grid gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-sm md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
              {product.seller_name ?? "Loja BelaPop"}
            </p>
            <h3 className="font-display text-2xl text-bpBlack">{product.name}</h3>
            <p className="text-sm text-bpGraphite/80">
              {formatPrice(product.price_cents / 100)} · Enviado em{" "}
              {new Date(product.created_at ?? 0).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Status: {product.status}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <LuxuryButton tone="retail" href={`/admin/products/${product.id}`}>
              Revisar
            </LuxuryButton>
            <LuxuryButton tone="retail" size="sm" onClick={() => handleNeedsAdjustment(product.id)}>
              Ajustes
            </LuxuryButton>
            <LuxuryButton tone="retail" size="sm" onClick={() => handleApprove(product.id)}>
              Aprovar
            </LuxuryButton>
            <LuxuryButton tone="retail" variant="outline" size="sm" onClick={() => handleReject(product.id)}>
              Reprovar
            </LuxuryButton>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80 shadow-sm">
          Nenhum produto com o filtro selecionado.
        </div>
      )}
    </div>
  );
}
