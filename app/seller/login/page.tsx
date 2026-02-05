"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

export default function SellerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await login(email, password, "seller");
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao entrar.");
      return;
    }
    router.push("/seller/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full rounded-3xl p-8"
      >
        <h1 className="font-display text-3xl text-blush-50">
          Portal do Lojista
        </h1>
        <p className="mt-2 text-sm text-blush-100/70">
          Acesse seu painel editorial de produtos.
        </p>
        <div className="mt-6 flex flex-col gap-4">
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
          <p className="mt-4 text-xs text-luxe-600">{message}</p>
        ) : null}
        <div className="mt-6">
          <LuxuryButton size="lg" className="w-full" type="submit">
            Entrar no painel
          </LuxuryButton>
        </div>
        <p className="mt-6 text-center text-xs text-blush-100/70">
          Ainda não tem cadastro?{" "}
          <Link href="/seller/register" className="text-blush-50">
            Criar conta de lojista
          </Link>
        </p>
      </form>
    </div>
  );
}
