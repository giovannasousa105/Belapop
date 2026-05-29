import type { Metadata } from "next";
import Link from "next/link";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Drops — Círculo BelaPop | ADM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Drop = {
  id: string;
  number: number;
  title: string;
  opens_at: string;
  closes_at: string;
  status: "draft" | "live" | "closed" | "fulfilling" | "delivered";
  total_orders: number;
  gmv_cents: number;
  created_at: string;
};

const STATUS_LABELS: Record<Drop["status"], string> = {
  draft:      "Rascunho",
  live:       "Em pré-venda",
  closed:     "Encerrado",
  fulfilling: "Em separação",
  delivered:  "Entregue",
};

const STATUS_CLASSES: Record<Drop["status"], string> = {
  draft:      "bg-neutral-100 text-neutral-600",
  live:       "bg-green-100 text-green-700",
  closed:     "bg-amber-100 text-amber-700",
  fulfilling: "bg-blue-100 text-blue-700",
  delivered:  "bg-neutral-200 text-neutral-500",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DropsListPage() {
  const supabase = getSupabaseAdminClient();

  const { data: drops, error } = await supabase
    .from("drops")
    .select("id, number, title, opens_at, closes_at, status, total_orders, gmv_cents, created_at")
    .order("number", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Drops</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Gerenciar drops quinzenais do Círculo BelaPop.
          </p>
        </div>
        <Link
          href="/adm/circulo/drops/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700"
        >
          + Novo drop
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          Erro ao carregar drops: {error.message}
        </div>
      )}

      {/* Tabela */}
      {!error && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Drop</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Título</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Abertura</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Fechamento</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Pedidos</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">GMV</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {!drops?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-neutral-400">
                    Nenhum drop criado ainda.{" "}
                    <Link href="/adm/circulo/drops/novo" className="font-medium text-black underline">
                      Criar o primeiro drop.
                    </Link>
                  </td>
                </tr>
              )}
              {drops?.map((drop) => (
                <tr key={drop.id} className="group transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    #{drop.number}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{drop.title}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(drop.opens_at)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(drop.closes_at)}</td>
                  <td className="px-4 py-3 text-neutral-700">{drop.total_orders}</td>
                  <td className="px-4 py-3 font-medium text-neutral-700">{formatCurrency(drop.gmv_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLASSES[drop.status as Drop["status"]] ?? ""}`}>
                      {STATUS_LABELS[drop.status as Drop["status"]] ?? drop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/adm/circulo/drops/${drop.id}`}
                      className="text-xs text-neutral-400 transition-colors hover:text-black"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
