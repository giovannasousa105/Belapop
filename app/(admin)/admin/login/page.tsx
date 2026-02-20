"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/lib/AuthContext";

type Mode = "password" | "magic";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loginWithMagicLink, loginWithOAuth, user, ready, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (user?.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (user) {
      setMessage("Acesso restrito. Use um perfil administrador.");
      void logout();
    }
  }, [ready, user, router, logout]);

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await login(email, password, "admin");
    setLoading(false);

    if (!result.ok) {
      if (result.message?.toLowerCase().includes("incompat")) {
        router.replace("/login?error=admin");
        return;
      }
      setMessage(result.message ?? "Acesso restrito.");
      return;
    }

    router.push("/admin/dashboard");
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await loginWithMagicLink(email, "/admin/login");
    setLoading(false);
    setMessage(result.message ?? (result.ok ? "Link enviado." : "Erro ao enviar link."));
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setMessage(null);
    const result = await loginWithOAuth(provider, "/admin/login");
    if (!result.ok) {
      setLoading(false);
      setMessage(result.message ?? "Nao foi possivel conectar.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMode("magic");
      setMessage("Informe seu e-mail para receber o link.");
      return;
    }
    setMode("magic");
    setLoading(true);
    setMessage(null);
    const result = await loginWithMagicLink(email, "/admin/login");
    setLoading(false);
    setMessage(result.message ?? (result.ok ? "Link enviado." : "Erro ao enviar link."));
  };

  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
            Acesso interno
          </p>
          <h1 className="mt-2 font-display text-3xl text-bpBlack">
            Login administrativo
          </h1>
          <p className="mt-2 text-sm text-bpGraphite/80">
            Apenas perfis autorizados.
          </p>
          <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
            {(["password", "magic"] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full border px-3 py-1 ${
                  mode === item
                    ? "border-bpPink text-bpBlackSoft"
                    : "border-black/10 text-bpGraphite/70"
                }`}
              >
                {item === "password" ? "Senha" : "Magic link"}
              </button>
            ))}
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
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
            />
            {mode === "password" ? (
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
              />
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-bpPink px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-bpSoft disabled:opacity-60"
            >
              {mode === "password" ? "Entrar" : "Enviar link"}
            </button>
          </form>
          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-bpGraphite/70 hover:text-bpBlackSoft"
            >
              Esqueci a senha
            </button>
          </div>
          {message ? (
            <p className="mt-4 text-xs text-bpPink">{message}</p>
          ) : null}
          <div className="my-6 border-t border-black/10" />
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlackSoft transition hover:border-bpGraphite/50 disabled:opacity-60"
            >
              Continuar com Google
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-bpGraphite/70">
            Retornar ao site?{" "}
            <Link href="/" className="text-bpBlackSoft">
              Voltar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
