"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";

const resolveDefaultPath = (role: string | undefined) => {
  if (role === "admin") return "/adm";
  if (role === "seller" || role === "partner") return "/parceiro";
  return "/conta";
};

const sanitizePath = (rawPath: string | null, fallback: string) => {
  if (!rawPath || rawPath.length === 0) return fallback;
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) return fallback;
  if (rawPath.startsWith("/mfa")) return fallback;
  return rawPath;
};

function MfaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, user, hasPasskey, registerPasskey, authenticateWithPasskey, logout } = useAuth();

  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = useMemo(
    () =>
      sanitizePath(
        searchParams.get("next"),
        resolveDefaultPath(user?.role)
      ),
    [searchParams, user?.role]
  );

  useEffect(() => {
    const load = async () => {
      if (!ready) return;
      if (!user) {
        router.replace("/login?auth_error=1");
        return;
      }

      const enabled = await hasPasskey();
      if (!enabled) {
        router.replace(nextPath);
        return;
      }
      setPasskeyEnabled(enabled);
      setChecking(false);
    };

    void load();
  }, [ready, user, router, hasPasskey, nextPath]);

  const handleRegister = async () => {
    setLoading(true);
    setMessage(null);
    const result = await registerPasskey();
    const enabled = await hasPasskey();
    setPasskeyEnabled(enabled);
    setLoading(false);
    setMessage(
      result.message ??
        (result.ok ? "Passkey cadastrada. Agora valide para continuar." : "Falha ao cadastrar Passkey.")
    );
  };

  const handleValidate = async () => {
    setLoading(true);
    setMessage(null);
    const result = await authenticateWithPasskey();
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message ?? "Falha ao validar Passkey.");
      return;
    }

    router.replace(nextPath);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-bpOffWhite text-bpBlackSoft">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-6 py-16">
        <div className="w-full rounded-[30px] border border-[rgba(216,160,172,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,238,240,0.9))] p-8 shadow-[0_24px_70px_rgba(91,49,56,0.08)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/82">
            Verificacao de seguranca
          </p>
          <h1 className="mt-2 font-display text-3xl text-bpBlack">
            Confirmar identidade com Passkey
          </h1>
          <p className="mt-2 text-sm text-bpGraphite/80">
            Para acessar o painel parceiro/admin, finalize a validacao com Passkey (WebAuthn).
          </p>

          {checking ? (
            <p className="mt-6 text-sm text-bpGraphite/82">Verificando status da Passkey...</p>
          ) : (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="w-full rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlackSoft transition hover:border-bpGraphite/50 disabled:opacity-60"
              >
                {passkeyEnabled ? "Recadastrar Passkey" : "Cadastrar Passkey"}
              </button>

              <button
                type="button"
                onClick={handleValidate}
                disabled={loading || !passkeyEnabled}
                className="w-full rounded-full bg-bpPinkCta px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.26)] disabled:opacity-60"
              >
                Validar e continuar
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpGraphite transition hover:border-bpGraphite/50 disabled:opacity-60"
              >
                Sair
              </button>
            </div>
          )}

          {message ? (
            <p className="mt-4 rounded-2xl border border-[rgba(216,160,172,0.28)] bg-bpPinkLux/90 px-3 py-2 text-xs text-bpBlackSoft">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense fallback={null}>
      <MfaContent />
    </Suspense>
  );
}
