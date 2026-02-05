"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { formatPrice } from "@/lib/utils";

type WalletRow = {
  id: string;
  type: string;
  amount_cents: number;
  reason: string | null;
  created_at: string;
};

export default function AccountWalletPage() {
  const { ready, user } = useAuth();
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("id,type,amount_cents,reason,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setRows(data ?? []);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  const balance = useMemo(
    () => rows.reduce((acc, row) => acc + Number(row.amount_cents ?? 0), 0) / 100,
    [rows]
  );

  return (
    <div className="space-y-6">
      <PageHeading
        title="Carteira"
        subtitle="Créditos e ajustes sempre visíveis."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Saldo</p>
        <p className="mt-2 text-3xl font-semibold text-noir-950">
          {formatPrice(balance)}
        </p>
        <p className="text-sm text-noir-600">Disponível para próximas compras.</p>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Histórico</p>
        {loading ? (
          <p className="mt-4 text-sm text-noir-500">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-noir-600">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-noir-900">{row.reason ?? "Movimentação"}</p>
                  <p className="text-xs text-noir-500">
                    {new Date(row.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-sm text-noir-900">
                  {formatPrice(Number(row.amount_cents ?? 0) / 100)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
