"use client";

import { useEffect, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type PaymentMethodRow = {
  id: string;
  provider: string;
  type: string | null;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean | null;
};

export default function AccountPaymentsPage() {
  const { ready, user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("id,provider,type,brand,last4,exp_month,exp_year,is_default")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setMethods(data ?? []);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Pagamentos"
        subtitle="Métodos salvos para acelerar seus próximos rituais."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Cartões e Pix</p>
          <button className="rounded-full bg-luxe-600 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-soft-luxe">
            Adicionar método
          </button>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-noir-500">Carregando...</p>
        ) : methods.length === 0 ? (
          <p className="mt-4 text-sm text-noir-600">
            Nenhum método salvo. Adicione para checkout mais rápido.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-noir-900">
                    {method.brand ?? method.provider} •••• {method.last4 ?? "0000"}
                  </p>
                  <p className="text-xs text-noir-500">
                    Validade {method.exp_month ?? "--"}/{method.exp_year ?? "--"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {method.is_default ? (
                    <span className="text-[10px] uppercase tracking-[0.3em] text-luxe-600">
                      Padrão
                    </span>
                  ) : (
                    <button className="text-xs uppercase tracking-[0.3em] text-noir-500">
                      Definir padrão
                    </button>
                  )}
                  <button className="text-xs uppercase tracking-[0.3em] text-noir-500">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
