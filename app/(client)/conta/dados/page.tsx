"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";

export default function ContaDadosPage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "seller") {
      router.replace("/parceiro");
      return;
    }
    if (user.role === "admin") {
      router.replace("/admin");
    }
  }, [ready, router, user]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
      <PageHeading title="Dados da conta" subtitle="Perfil, enderecos e preferencias com ajuste fino." />

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/account/profile"
          className="rounded-2xl border border-black/10 bg-white px-6 py-5 shadow-sm transition hover:border-black/30"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Perfil</p>
          <p className="mt-2 text-lg font-semibold text-bpBlack">Dados pessoais</p>
          <p className="mt-2 text-sm text-bpGraphite/80">Nome, e-mail e informacoes de acesso.</p>
        </Link>

        <Link
          href="/account/addresses"
          className="rounded-2xl border border-black/10 bg-white px-6 py-5 shadow-sm transition hover:border-black/30"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Enderecos</p>
          <p className="mt-2 text-lg font-semibold text-bpBlack">Entrega e faturamento</p>
          <p className="mt-2 text-sm text-bpGraphite/80">Gerencie enderecos para uma entrega sem friccao.</p>
        </Link>
      </div>
    </div>
  );
}

