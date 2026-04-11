"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { AdmMockProfileOption } from "@/types/adm/auth";

type LoginFormProps = {
  nextPath?: string;
  reason?: string;
  mockProfiles: AdmMockProfileOption[];
  showMockProfiles: boolean;
  mockPasswordHint?: string;
};

const reasonMessageMap: Record<string, string> = {
  "session-expired": "Sua sessao interna expirou. Entre novamente para continuar.",
  "invalid-session": "Nao foi possivel validar sua sessao interna. Entre novamente.",
  "signed-out": "Sessao encerrada com sucesso."
};

export function LoginForm({
  nextPath,
  reason,
  mockProfiles,
  showMockProfiles,
  mockPasswordHint
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(mockProfiles[0]?.email ?? "");
  const [password, setPassword] = useState(showMockProfiles ? mockPasswordHint ?? "" : "");
  const [message, setMessage] = useState(reason ? reasonMessageMap[reason] ?? null : null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/adm/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          next: nextPath
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error ?? "Nao foi possivel autenticar este perfil interno.");
        setLoading(false);
        return;
      }

      router.replace(payload.redirectTo ?? "/adm");
      router.refresh();
    } catch {
      setMessage("Falha ao conectar a sessao interna.");
      setLoading(false);
    }
  };

  const fillMockProfile = (profile: AdmMockProfileOption) => {
    setEmail(profile.email);
    if (showMockProfiles && mockPasswordHint) {
      setPassword(mockPasswordHint);
    }
    setMessage(null);
  };

  return (
    <div className="w-full rounded-[32px] border border-[#d7cfc2] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(243,238,229,0.96))] p-8 shadow-[0_30px_90px_rgba(32,30,28,0.12)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#736b61]">Acesso interno</p>
          <h1 className="mt-3 font-editorial text-4xl text-[#1f1b18]">ADM BelaPop</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5f564d]">
            Ambiente institucional para operacao, curadoria, financeiro e governanca.
          </p>
        </div>
        <div className="hidden rounded-full border border-[#d8d1c5] bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#645d54] md:block">
          Sessao mock preparada para backend real
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[#736b61]">
            E-mail interno
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[#d4cdc2] bg-white px-4 text-sm text-[#241f1b] outline-none transition focus:border-[#9f968a]"
            placeholder="nome@belapop.internal"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[#736b61]">
            Senha
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[#d4cdc2] bg-white px-4 text-sm text-[#241f1b] outline-none transition focus:border-[#9f968a]"
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#1f1b18] px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#faf7f1] shadow-[0_18px_40px_rgba(32,30,28,0.18)] transition hover:bg-[#2b2622] disabled:opacity-60"
        >
          {loading ? "Validando acesso" : "Entrar no ADM"}
        </button>
      </form>

      {message ? (
        <div className="mt-4 rounded-2xl border border-[#dfd4c8] bg-white/90 px-4 py-3 text-sm text-[#4c463e]">
          {message}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[#e3dbcf] bg-white/70 p-4 text-xs text-[#655d54]">
        <p className="font-semibold uppercase tracking-[0.18em] text-[#5a534b]">Ambiente interno</p>
        <p className="mt-2 leading-relaxed">
          Esta camada usa sessao mockada por cookie assinado e foi preparada para troca futura por provedor real,
          JWT ou sessao server-side.
        </p>
        {showMockProfiles && mockPasswordHint ? (
          <p className="mt-3 uppercase tracking-[0.14em] text-[#5a534b]">
            Senha local mock: <span className="font-semibold">{mockPasswordHint}</span>
          </p>
        ) : null}
      </div>

      {showMockProfiles && mockProfiles.length > 0 ? (
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#736b61]">
            Perfis para validacao local
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mockProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => fillMockProfile(profile)}
                className="rounded-2xl border border-[#d8d1c5] bg-white/80 px-4 py-3 text-left transition hover:border-[#b8b0a4]"
              >
                <span className="block text-sm font-semibold text-[#231f1c]">{profile.name}</span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-[#746d63]">
                  {profile.roleLabel}
                </span>
                <span className="mt-2 block text-xs text-[#5f584f]">{profile.email}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
