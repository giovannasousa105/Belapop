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
    title: "Cartão de crédito",
    badge: "Por sessão",
    description: "Habilitado via Stripe por pedido.",
    icon: CreditCard
  },
  {
    id: "debit",
    title: "Cartão de débito",
    badge: "Por sessão",
    description: "Disponível quando emissor e Stripe liberam.",
    icon: WalletCards
  },
  {
    id: "pix",
    title: "Pix",
    badge: "Por sessão",
    description: "Exibido quando a conta Stripe habilita o meio.",
    icon: QrCode
  },
  {
    id: "boleto",
    title: "Boleto",
    badge: "Por sessão",
    description: "Gerado quando a sessão Stripe oferecer o meio.",
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
  if (["debit", "debit_card", "card_debit"].includes(normalizedType)) return "Débito";
  if (["credit", "credit_card", "card", "card_credit"].includes(normalizedType))
    return "Crédito";
  return "Cartão";
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
    <section className={`rounded-3xl border border-[#e8e0d8] bg-white p-8 shadow-[0_4px_24px_rgba(30,15,5,0.05)] ${className ?? ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#9b9b96]">Formas de pagamento</p>
          <h2 className="mt-2 font-display text-3xl font-light text-[#1e1e1e]">Crédito, débito, boleto e Pix</h2>
          <p className="mt-3 max-w-2xl text-sm text-[#4a4a47]/70">
            Consulte os meios que sua sessão de checkout habilita e acompanhe os cartões salvos.
          </p>
        </div>

        <Link
          href="/checkout"
          className="inline-flex items-center justify-center rounded-full border border-[#d4845f]/40 bg-[#d4845f]/10 px-5 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#1e1e1e] transition hover:bg-[#d4845f]/20"
        >
          Ir para checkout
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {AVAILABLE_METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <article
              key={method.id}
              className="rounded-xl border border-[#e8e0d8] bg-[#fdfcfb] p-4 transition hover:border-[#d4845f]/30"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-[#fdf4f1] p-2 text-[#d4845f]">
                  <Icon size={18} />
                </span>
                <span className="rounded-full border border-[#e8e0d8] px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-[#9b9b96]">
                  {method.badge}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-[#1e1e1e]">{method.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9b9b96]">{method.description}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-[#e8e0d8] bg-[#fdfcfb] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#9b9b96]">Métodos salvos</p>
            <p className="mt-1 text-sm text-[#4a4a47]/70">
              Cartões tokenizados para agilizar o pagamento via Stripe.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9b9b96]">
            Pix e boleto são habilitados por sessão
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[#9b9b96]">Carregando métodos salvos...</p>
        ) : savedCards.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#e8e0d8] p-4 text-sm text-[#9b9b96]">
            Nenhum cartão salvo ainda. Use crédito, débito, Pix ou boleto no checkout.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {savedCards.map((method) => (
              <div
                key={method.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#e8e0d8] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#1e1e1e]">{formatCardLabel(method)}</p>
                    <span className="rounded-full border border-[#e8e0d8] bg-white px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#9b9b96]">
                      {methodTypeLabel(method)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9b9b96]">{formatValidity(method)}</p>
                </div>

                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  {method.is_default ? (
                    <span className="rounded-full border border-[#d4845f]/30 bg-[#d4845f]/10 px-3 py-1 text-[#d4845f]">
                      Padrão
                    </span>
                  ) : (
                    <span className="text-[#9b9b96]">Secundário</span>
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

