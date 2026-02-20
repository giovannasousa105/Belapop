"use client";

import Link from "next/link";

import { useAuth } from "@/lib/AuthContext";

const statusCopy: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em curadoria",
  approved: "Aprovada",
  active: "Ativa",
  paused: "Pausada",
  rejected: "Reprovada"
};

export default function SellerActivationPage() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-bpGraphite/70">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-bpBlackSoft">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
              Ativacao de lojista
            </p>
            <h1 className="mt-2 font-display text-3xl text-bpBlack">
              Entre para acompanhar sua aprovacao.
            </h1>
            <p className="mt-3 text-sm text-bpGraphite/80">
              A curadoria BelaPop cuida de cada detalhe. Acesse seu painel para
              ver o status.
            </p>
            <div className="mt-6">
              <Link
                href="/seller/login"
                className="rounded-full bg-bpPink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-bpSoft"
              >
                Entrar no portal do lojista
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = user.sellerProfile?.status ?? "pending";
  const isApproved = status === "approved" || status === "active";

  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
            Ativacao de lojista
          </p>
          <h1 className="mt-2 font-display text-3xl text-bpBlack">
            {isApproved ? "Sua loja foi aprovada." : "Sua loja ainda nao esta aprovada."}
          </h1>
          <p className="mt-3 text-sm text-bpGraphite/80">
            Status atual:{" "}
            <span className="font-semibold text-bpBlackSoft">
              {statusCopy[status] ?? "Em analise"}
            </span>
          </p>
          <p className="mt-3 text-sm text-bpGraphite/80">
            {isApproved
              ? "Voce ja pode acessar o painel completo e publicar produtos."
              : "Assim que sua loja for aprovada, voce tera acesso completo ao painel e podera publicar produtos."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/seller/dashboard"
              className="rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-bpGraphite"
            >
              Ir para o painel
            </Link>
            <Link
              href="/seller/partner"
              className="rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-bpGraphite"
            >
              Entender o processo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
