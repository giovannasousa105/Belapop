"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, QrCode, WalletCards } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

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

type CustomerPaymentMethodsPanelProps = {
  compact?: boolean;
  className?: string;
};

const AVAILABLE_METHODS = [
  {
    id: "credit",
    title: "Cartao de credito",
    badge: "Depende da sessao",
    description:
      "Cartao aparece quando a sessao Stripe do pedido habilita esse meio para a conta ativa.",
    icon: CreditCard
  },
  {
    id: "debit",
    title: "Cartao de debito",
    badge: "Depende da sessao",
    description:
      "Debito so aparece quando o Stripe e o emissor liberam esse meio para o pedido atual.",
    icon: WalletCards
  },
  {
    id: "pix",
    title: "Pix",
    badge: "Depende da sessao",
    description:
      "Pix so e exibido quando a configuracao da conta Stripe ativa esse meio para o checkout.",
    icon: QrCode
  },
  {
    id: "boleto",
    title: "Boleto",
    badge: "Depende da sessao",
    description:
      "Boleto e gerado apenas quando a sessao Stripe do pedido oferecer esse meio.",
    icon: Landmark
  }
] as const;

const methodTypeLabel = (method: PaymentMethodRow) => {
  const normalizedType = String(method.type ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (normalizedType === "pix") return "Pix";
  if (normalizedType === "boleto") return "Boleto";
  if (["debit", "debit_card", "card_debit"].includes(normalizedType)) return "Debito";
  if (["credit", "credit_card", "card", "card_credit"].includes(normalizedType))
    return "Credito";
  return "Cartao";
};

const formatCardLabel = (method: PaymentMethodRow) => {
  const brand = method.brand ?? method.provider ?? "Cartao";
  if (method.last4) return `${brand} **** ${method.last4}`;
  return brand;
};

const formatValidity = (method: PaymentMethodRow) => {
  if (!method.exp_month || !method.exp_year) return "Validade informada no checkout";
  return `Validade ${String(method.exp_month).padStart(2, "0")}/${String(method.exp_year)}`;
};

export default function CustomerPaymentMethodsPanel(
  props: CustomerPaymentMethodsPanelProps
) {
  const { compact = false, className } = props;
  const { ready, user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setMethods([]);
      setLoading(false);
      return;
    }

    let active = true;
    const supabase = getSupabaseClient();
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

  const savedCards = useMemo(
    () => methods.filter((method) => !["pix", "boleto"].includes(String(method.type ?? "").toLowerCase())),
    [methods]
  );

  return (
    <section className={`rounded-3xl border border-black/10 bg-white p-6 shadow-sm ${className ?? ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Formas de pagamento</p>
          <h2 className="mt-3 font-display text-3xl text-bpBlack">Credito, debito, boleto e Pix</h2>
          <p className="mt-3 max-w-2xl text-sm text-bpGraphite/75">
            Consulte os meios que a sua sessao de checkout realmente habilita e acompanhe os cartoes salvos para compras futuras.
          </p>
        </div>

        <Link
          href="/checkout"
          className="inline-flex items-center justify-center rounded-full border border-bpPink/40 bg-bpPink/10 px-5 py-3 text-xs font-medium uppercase tracking-[0.24em] text-bpBlackSoft transition hover:border-bpPink/70 hover:bg-bpPink/15"
        >
          Ir para checkout
        </Link>
      </div>

      <div className={`mt-6 grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4"}`}>
        {AVAILABLE_METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <article
              key={method.id}
              className="rounded-2xl border border-black/10 bg-bpOffWhite/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-bpBlackSoft">
                  <Icon size={18} />
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-700">
                  {method.badge}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold text-bpBlack">{method.title}</p>
              <p className="mt-2 text-sm text-bpGraphite/75">{method.description}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-bpGraphite/60">Metodos salvos</p>
            <p className="mt-1 text-sm text-bpGraphite/75">
              Cartoes tokenizados aparecem aqui para acelerar o pagamento quando a sessao Stripe permitir cartao.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">
            Pix e boleto so aparecem quando a sessao do pedido os habilita
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-bpGraphite/70">Carregando metodos salvos...</p>
        ) : savedCards.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-bpOffWhite/60 p-4 text-sm text-bpGraphite/75">
            Nenhum cartao salvo ainda. Voce pode usar credito, debito, Pix ou boleto no checkout.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {savedCards.map((method) => (
              <div
                key={method.id}
                className="flex flex-col gap-3 rounded-2xl border border-black/10 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-bpBlackSoft">{formatCardLabel(method)}</p>
                    <span className="rounded-full border border-black/10 bg-bpOffWhite px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-bpGraphite/70">
                      {methodTypeLabel(method)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-bpGraphite/70">{formatValidity(method)}</p>
                </div>

                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  {method.is_default ? (
                    <span className="rounded-full border border-bpPink/30 bg-bpPink/10 px-3 py-1 text-bpPink">
                      Padrao
                    </span>
                  ) : (
                    <span className="text-bpGraphite/60">Secundario</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

