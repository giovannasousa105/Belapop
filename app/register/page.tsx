"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { registerCustomer } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await registerCustomer(name, email, password);
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao cadastrar.");
      return;
    }
    router.push("/minha-conta");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full rounded-3xl p-8"
      >
        <h1 className="font-display text-3xl text-bpOffWhite">Criar conta</h1>
        <p className="mt-2 text-sm text-bpPinkSoft/70">
          Cadastre-se para acompanhar pedidos e wishlist.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
          />
        </div>
        {message ? (
          <p className="mt-4 text-xs text-bpPink">{message}</p>
        ) : null}
        <div className="mt-6">
          <LuxuryButton size="lg" className="w-full" type="submit">
            Criar cadastro
          </LuxuryButton>
        </div>
        <p className="mt-6 text-center text-xs text-bpPinkSoft/70">
          Já tem conta?{" "}
          <Link href="/login" className="text-bpOffWhite">
            Entrar
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-bpPinkSoft/70">
          Cadastro de lojista?{" "}
          <Link href="/seller/register" className="text-bpOffWhite">
            Ir para o portal
          </Link>
        </p>
      </form>
    </div>
  );
}
