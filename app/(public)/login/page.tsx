"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";

import { useAuth } from "@/lib/AuthContext";
import type { UserRole } from "@/lib/types";

type Mode = "password" | "magic";
type Audience = "customer" | "partner";
type RevealState = "hidden" | "visible";

const GENERIC_ERROR_MESSAGE = "Algo saiu do roteiro. Tentar novamente.";

function mapAuthError(message: string | undefined) {
  const value = (message ?? "").toLowerCase();
  if (value.includes("invalid login credentials") || value.includes("credenciais")) {
    return "Credenciais invalidas. Confira e tente novamente.";
  }
  if (value.includes("email not confirmed")) {
    return "Confirme seu e-mail para continuar.";
  }
  if (value.includes("rate limit")) {
    return "Muitas tentativas em sequencia. Aguarde um instante.";
  }
  return GENERIC_ERROR_MESSAGE;
}

function resolvePostLoginPath(role: UserRole, audience: Audience) {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/parceiro";
  if (audience === "partner") return "/parceiro/onboarding?status=pending";
  return "/conta";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithMagicLink, loginWithOAuth, user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [audience, setAudience] = useState<Audience>("customer");
  const [message, setMessage] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminReveal, setAdminReveal] = useState<RevealState>("hidden");
  const [loading, setLoading] = useState(false);
  const keyBuffer = useRef("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "partner" || tab === "customer") {
      setAudience(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(resolvePostLoginPath(user.role, audience));
  }, [audience, ready, user, router]);

  useEffect(() => {
    if (searchParams.get("error") === "admin" || searchParams.get("forbidden") === "1") {
      setAdminMessage("Acesso restrito. Use um perfil administrador.");
    }

    if (searchParams.get("error_code") === "otp_expired") {
      setMessage("Seu magic link expirou. Solicite um novo.");
    }
  }, [searchParams]);

  useEffect(() => {
    const reveal = () => {
      setAdminReveal("visible");
      window.setTimeout(() => setAdminReveal("hidden"), 10000);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.ctrlKey && event.shiftKey && key === "a") {
        event.preventDefault();
        reveal();
        return;
      }
      if (key.length === 1 && key >= "a" && key <= "z") {
        keyBuffer.current = `${keyBuffer.current}${key}`.slice(-20);
        if (keyBuffer.current.includes("belapopadmin")) {
          reveal();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clearFeedback = () => setMessage(null);

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    clearFeedback();
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setMessage(mapAuthError(result.message));
      return;
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    clearFeedback();
    const redirectTo = `/login?tab=${audience}`;
    const result = await loginWithMagicLink(email, redirectTo);
    setLoading(false);
    if (!result.ok) {
      setMessage(mapAuthError(result.message));
      return;
    }
    setMessage("Enviamos um link seguro para o seu e-mail.");
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    clearFeedback();
    const redirectTo = `/login?tab=${audience}`;
    const result = await loginWithOAuth(provider, redirectTo);
    if (!result.ok) {
      setLoading(false);
      setMessage(mapAuthError(result.message));
    }
  };

  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center">
        <div className="space-y-4 lg:max-w-md">
          <p className="text-xs uppercase tracking-[0.4em] text-bpGraphite/70">BelaPop</p>
          <h1 className="font-display text-4xl text-bpBlack">Bem-vinda de volta.</h1>
          <p className="text-sm text-bpGraphite/80">
            Acesse sua curadoria, pedidos e preferencias com experiencia premium.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">Login</p>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
              {(["customer", "partner"] as Audience[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAudience(item)}
                  className={`rounded-full border px-3 py-1 ${
                    audience === item
                      ? "border-bpPink text-bpBlackSoft"
                      : "border-black/10 text-bpGraphite/70"
                  }`}
                >
                  {item === "customer" ? "Cliente" : "Parceiro"}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-bpGraphite/70">
            {audience === "partner"
              ? "Entre como parceiro e validamos seu acesso de lojista."
              : "Entre para acessar pedidos, favoritos e sua curadoria."}
          </p>

          {adminMessage ? (
            <p className="mt-3 rounded-2xl border border-bpPinkSoft bg-bpPinkSoft/20 px-3 py-2 text-xs text-bpPink/90">
              {adminMessage}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
            {(["password", "magic"] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full border px-3 py-1 ${
                  mode === item ? "border-bpPink text-bpBlackSoft" : "border-black/10 text-bpGraphite/70"
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
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink"
            />
            {mode === "password" ? (
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-bpPink"
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
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              disabled={loading}
              className="w-full rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlackSoft transition hover:border-bpGraphite/50 disabled:opacity-60"
            >
              Continuar com Facebook
            </button>
          </div>

          {message ? <p className="mt-4 text-xs text-bpPink">{message}</p> : null}

          <p className="mt-6 text-center text-xs text-bpGraphite/70">
            Ainda nao tem conta?{" "}
            <Link href="/register" className="text-bpBlackSoft">
              Criar cadastro
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-bpGraphite/70">
            E lojista?{" "}
            <Link href="/parceiro" className="text-bpBlackSoft">
              Entrar no portal
            </Link>
          </p>

          {adminReveal === "visible" ? (
            <div className="mt-6 text-center text-[11px] uppercase tracking-[0.35em] text-bpGraphite/60">
              <Link href="/admin/login" className="hover:text-bpBlackSoft">
                Acesso interno
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
