"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

export default function SellerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await login(email, password, "seller");
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao entrar.");
      return;
    }
    router.push("/seller/dashboard");
  };

  return (
    <div className="bg-bpOffWhite">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-bpLg border border-bpPink/15 bg-white p-8 shadow-bpMicro"
      >
        <h1 className="font-display text-3xl text-bpBlack">
          Portal do Lojista
        </h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Acesse sua operacao editorial de produtos.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink"
          />
        </div>
        {message ? (
          <p className="mt-4 text-xs text-bpPink">{message}</p>
        ) : null}
        <div className="mt-6">
          <LuxuryButton size="lg" className="w-full" type="submit">
            Entrar no painel
          </LuxuryButton>
        </div>
        <p className="mt-6 text-center text-xs text-bpGraphite/75">
          Ainda nao tem cadastro?{" "}
          <Link href="/seller/apply" className="text-bpPink">
            Criar conta de lojista
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}
