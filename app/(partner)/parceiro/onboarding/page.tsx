"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";

type ApplicationStatus = "pending" | "approved" | "rejected" | null;

type ApplicationFormState = {
  brandName: string;
  cnpj: string;
  contactName: string;
  phone: string;
  instagram: string;
  catalogLink: string;
};

const INITIAL_FORM: ApplicationFormState = {
  brandName: "",
  cnpj: "",
  contactName: "",
  phone: "",
  instagram: "",
  catalogLink: ""
};

export default function ParceiroOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, user } = useAuth();
  const [form, setForm] = useState<ApplicationFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?tab=partner");
      return;
    }
    const grantedRoles = new Set([user.role, ...(user.roles ?? [])]);
    if (grantedRoles.has("seller") || grantedRoles.has("admin")) {
      router.replace("/parceiro");
      return;
    }
    let active = true;
    setLoading(true);

    const loadStatus = async () => {
      const response = await fetch("/api/partner-applications", { cache: "no-store" });
      if (!active) return;

      if (!response.ok) {
        setMessage("Algo saiu do roteiro. Tentar novamente.");
        setLoading(false);
        return;
      }

      const json = (await response.json()) as {
        application?: {
          status?: ApplicationStatus;
          brand_name?: string;
          contact_name?: string;
        } | null;
      };

      const externalStatus = searchParams.get("status");
      const resolvedStatus = (externalStatus as ApplicationStatus) ?? json.application?.status ?? null;
      setStatus(resolvedStatus);

      if (resolvedStatus === "pending") {
        setMessage("Seu acesso de parceiro esta em analise.");
      } else if (resolvedStatus === "rejected") {
        setMessage("Sua ultima solicitacao precisa de ajustes.");
      } else if (resolvedStatus === "approved") {
        setMessage("Solicitacao aprovada. Finalize seu acesso no portal.");
      }

      if (json.application?.brand_name || json.application?.contact_name) {
        setForm((current) => ({
          ...current,
          brandName: json.application?.brand_name ?? current.brandName,
          contactName: json.application?.contact_name ?? current.contactName
        }));
      }

      setLoading(false);
    };

    void loadStatus();

    return () => {
      active = false;
    };
  }, [ready, router, searchParams, user]);

  const setField = (key: keyof ApplicationFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/partner-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const json = (await response.json()) as { error?: string; status?: ApplicationStatus };
    setSubmitting(false);

    if (!response.ok) {
      setMessage(json.error ?? "Algo saiu do roteiro. Tentar novamente.");
      return;
    }

    setStatus(json.status ?? "pending");
    setMessage("Seu acesso de parceiro esta em analise.");
  };

  return (
    <div className="min-h-[70vh] bg-white px-6 py-14">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">Portal do Parceiro</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Solicitar parceria</h1>
        <p className="mt-3 text-sm text-bpGraphite/80">
          Venda na BelaPop com curadoria editorial e operacao premium.
        </p>

        {message ? (
          <p className="mt-4 rounded-2xl border border-bpPink/20 bg-bpPink/5 px-4 py-3 text-sm text-bpPink">
            {message}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            value={form.brandName}
            onChange={(event) => setField("brandName", event.target.value)}
            placeholder="Nome da marca *"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink md:col-span-2"
          />
          <input
            value={form.cnpj}
            onChange={(event) => setField("cnpj", event.target.value)}
            placeholder="CNPJ"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink"
          />
          <input
            value={form.contactName}
            onChange={(event) => setField("contactName", event.target.value)}
            placeholder="Contato responsavel *"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink"
          />
          <input
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="WhatsApp"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink"
          />
          <input
            value={form.instagram}
            onChange={(event) => setField("instagram", event.target.value)}
            placeholder="Instagram"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink"
          />
          <input
            value={form.catalogLink}
            onChange={(event) => setField("catalogLink", event.target.value)}
            placeholder="Link de catalogo ou midia kit"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink md:col-span-2"
          />

          <button
            type="submit"
            disabled={loading || submitting || status === "pending"}
            className="rounded-full bg-bpPink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
          >
            {submitting ? "Enviando..." : status === "pending" ? "Em analise" : "Enviar solicitacao"}
          </button>
          <Link
            href="/seller/partner"
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlackSoft"
          >
            Ver como funciona
          </Link>
        </form>
      </div>
    </div>
  );
}
