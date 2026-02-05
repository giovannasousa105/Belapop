"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/AuthContext";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithMagicLink, loginWithOAuth, user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    if (user.role === "seller") {
      router.push("/seller/dashboard");
      return;
    }
    router.push("/account");
  }, [ready, user, router]);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao entrar.");
    }
  };

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await loginWithMagicLink(email);
    setLoading(false);
    setMessage(result.message ?? (result.ok ? "Link enviado." : "Erro ao enviar link."));
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setMessage(null);
    const result = await loginWithOAuth(provider);
    if (!result.ok) {
      setLoading(false);
      setMessage(result.message ?? "Nao foi possivel conectar.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-noir-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center">
        <div className="space-y-4 lg:max-w-md">
          <p className="text-xs uppercase tracking-[0.4em] text-noir-500">BelaPop</p>
          <h1 className="font-display text-4xl text-noir-950">
            Bem-vinda de volta.
          </h1>
          <p className="text-sm text-noir-600">
            Acesse sua curadoria, pedidos e preferencias com experiencia premium.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-noir-500">Login</p>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
              {(["password", "magic"] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full border px-3 py-1 ${
                    mode === item
                      ? "border-luxe-600 text-noir-900"
                      : "border-black/10 text-noir-500"
                  }`}
                >
                  {item === "password" ? "Senha" : "Magic link"}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
            className="mt-6 space-y-4"
          >
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-luxe-600"
            />
            {mode === "password" && (
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-luxe-600"
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-luxe-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-soft-luxe disabled:opacity-60"
            >
              {mode === "password" ? "Entrar" : "Enviar link"}
            </button>
          </form>

          <div className="my-6 border-t border-black/10" />

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-noir-800 transition hover:border-noir-400 disabled:opacity-60"
            >
              Continuar com Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              disabled={loading}
              className="w-full rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-noir-800 transition hover:border-noir-400 disabled:opacity-60"
            >
              Continuar com Facebook
            </button>
          </div>

          {message ? (
            <p className="mt-4 text-xs text-luxe-600">{message}</p>
          ) : null}

          <p className="mt-6 text-center text-xs text-noir-500">
            Ainda nao tem conta?{" "}
            <Link href="/register" className="text-noir-900">
              Criar cadastro
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-noir-500">
            E lojista?{" "}
            <Link href="/seller/login" className="text-noir-900">
              Entrar no portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
