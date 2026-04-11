"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { registerCustomer } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await registerCustomer(name, email, password);
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message ?? "Erro ao cadastrar.");
      return;
    }

    router.push("/minha-conta");
  };

  return (
    <div className="min-h-screen bg-bpOffWhite text-bpBlackSoft">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-start">
        <div className="space-y-4 lg:max-w-md">
          <p className="text-xs uppercase tracking-[0.4em] text-bpGraphite/82">BelaPop</p>
          <h1 className="font-display text-4xl text-bpBlack">Crie sua conta.</h1>
          <p className="text-sm text-bpGraphite/80">
            Entre para acompanhar pedidos, favoritos e sua curadoria com uma experiencia mais elegante e organizada.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-[30px] border border-[rgba(216,160,172,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,238,240,0.9))] p-8 shadow-[0_24px_70px_rgba(91,49,56,0.08)] backdrop-blur"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/82">Cadastro</p>
          <h2 className="mt-2 font-display text-3xl text-bpBlack">Criar conta BelaPop</h2>
          <p className="mt-2 text-sm text-bpGraphite/82">
            Dados essenciais para iniciar sua experiencia premium.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-bpBlackSoft placeholder:text-bpGraphite/70 focus:border-bpPink/50 focus:outline-none"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-bpBlackSoft placeholder:text-bpGraphite/70 focus:border-bpPink/50 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-bpBlackSoft placeholder:text-bpGraphite/70 focus:border-bpPink/50 focus:outline-none"
            />
          </div>

          {message ? (
            <p className="mt-4 rounded-2xl border border-[rgba(216,160,172,0.28)] bg-bpPinkLux/90 px-3 py-2 text-xs text-bpBlackSoft">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-bpPinkCta px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.26)] disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar cadastro"}
          </button>

          <p className="mt-6 text-center text-xs text-bpGraphite/82">
            Ja tem conta?{" "}
            <Link href="/login" className="text-bpBlackSoft">
              Entrar
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-bpGraphite/82">
            Cadastro de lojista?{" "}
            <Link href="/seller/register" className="text-bpBlackSoft">
              Ir para o portal
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
