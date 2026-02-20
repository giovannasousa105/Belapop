"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProviderStatus = {
  google: boolean;
  facebook: boolean;
};

export default function AccountProfilePage() {
  const { user, loginWithOAuth } = useAuth();
  const [status, setStatus] = useState<ProviderStatus>({ google: false, facebook: false });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getUser();
      const identities = data.user?.identities ?? [];
      setStatus({
        google: identities.some((id) => id.provider === "google"),
        facebook: identities.some((id) => id.provider === "facebook")
      });
    };
    void load();
  }, []);

  const greeting = useMemo(
    () =>
      user?.name
        ? `Seus dados atuais: ${user.name} • ${user.email}`
        : "Complete seu perfil",
    [user]
  );

  const handleConnect = async (provider: "google" | "facebook") => {
    setMessage(null);
    const result = await loginWithOAuth(provider);
    if (!result.ok) {
      setMessage(result.message ?? "Não foi possível conectar.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Perfil"
        subtitle="Informações simples ajudam a personalizar sua experiência."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm text-sm text-bpGraphite/80">
        <p className="text-sm text-bpBlackSoft">{greeting}</p>
        <p className="mt-3 text-sm text-bpGraphite/80">
          Atualize nome, e-mail e telefone para manter a curadoria alinhada.
        </p>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Contas conectadas</p>
        <div className="mt-4 space-y-3">
          {(["google", "facebook"] as const).map((provider) => (
            <div
              key={provider}
              className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm"
            >
              <div>
                <p className="font-semibold text-bpBlackSoft">
                  {provider === "google" ? "Google" : "Facebook"}
                </p>
                <p className="text-xs text-bpGraphite/70">
                  {status[provider] ? "Conectado" : "Não conectado"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConnect(provider)}
                  className="rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-bpGraphite"
                >
                  {status[provider] ? "Reconectar" : "Conectar"}
                </button>
                <span className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/60">
                  Desconectar não disponível
                </span>
              </div>
            </div>
          ))}
        </div>
        {message && <p className="mt-3 text-xs text-bpPink">{message}</p>}
      </div>
    </div>
  );
}
