"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { type PasskeyDevice, useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProviderStatus = {
  google: boolean;
  facebook: boolean;
};

type SecurityStatus = {
  passkeySupported: boolean;
  passkeyEnabled: boolean;
  checking: boolean;
  busy: boolean;
};

export default function AccountProfilePage() {
  const {
    user,
    loginWithOAuth,
    hasPasskey,
    registerPasskey,
    authenticateWithPasskey,
    listPasskeys,
    removePasskey
  } = useAuth();
  const [status, setStatus] = useState<ProviderStatus>({
    google: false,
    facebook: false
  });
  const [security, setSecurity] = useState<SecurityStatus>({
    passkeySupported: false,
    passkeyEnabled: false,
    checking: true,
    busy: false
  });
  const [message, setMessage] = useState<string | null>(null);
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyDevice[]>([]);

  const refreshPasskeys = useCallback(
    async (passkeySupported: boolean) => {
      if (!passkeySupported) {
        setSecurity((prev) => ({ ...prev, passkeyEnabled: false }));
        setPasskeys([]);
        return;
      }

      const [enabled, devices] = await Promise.all([hasPasskey(), listPasskeys()]);
      setSecurity((prev) => ({ ...prev, passkeyEnabled: enabled }));
      setPasskeys(
        devices.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    },
    [hasPasskey, listPasskeys]
  );

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getUser();
      const identities = data.user?.identities ?? [];

      const passkeySupported =
        typeof window !== "undefined" &&
        typeof PublicKeyCredential !== "undefined" &&
        typeof navigator?.credentials !== "undefined";
      setStatus({
        google: identities.some((id) => id.provider === "google"),
        facebook: identities.some((id) => id.provider === "facebook")
      });

      setSecurity({
        passkeySupported,
        passkeyEnabled: false,
        checking: false,
        busy: false
      });

      await refreshPasskeys(passkeySupported);
    };

    void load();
  }, [refreshPasskeys]);

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
      setMessage(result.message ?? "Nao foi possivel conectar.");
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyMessage(null);
    setSecurity((prev) => ({ ...prev, busy: true }));

    const result = await registerPasskey();
    if (result.ok) {
      await refreshPasskeys(security.passkeySupported);
    }

    setSecurity((prev) => ({ ...prev, busy: false }));
    setPasskeyMessage(
      result.message ?? (result.ok ? "Passkey ativada com sucesso." : "Falha ao ativar Passkey.")
    );
  };

  const handleValidatePasskey = async () => {
    setPasskeyMessage(null);
    setSecurity((prev) => ({ ...prev, busy: true }));

    const result = await authenticateWithPasskey();
    setSecurity((prev) => ({ ...prev, busy: false }));
    setPasskeyMessage(
      result.message ??
        (result.ok ? "Passkey validada com sucesso." : "Falha ao validar Passkey.")
    );
  };

  const handleRemovePasskey = async (factorId: string) => {
    setPasskeyMessage(null);
    setSecurity((prev) => ({ ...prev, busy: true }));

    const result = await removePasskey(factorId);
    if (result.ok) {
      await refreshPasskeys(security.passkeySupported);
    }

    setSecurity((prev) => ({ ...prev, busy: false }));
    setPasskeyMessage(
      result.message ?? (result.ok ? "Passkey removida." : "Falha ao remover Passkey.")
    );
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Perfil"
        subtitle="Informacoes simples ajudam a personalizar sua experiencia."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80 shadow-sm">
        <p className="text-sm text-bpBlackSoft">{greeting}</p>
        <p className="mt-3 text-sm text-bpGraphite/80">
          Atualize nome, e-mail e telefone para manter a curadoria alinhada.
        </p>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
          Contas conectadas
        </p>
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
                  {status[provider] ? "Conectado" : "Nao conectado"}
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
                  Desconectar nao disponivel
                </span>
              </div>
            </div>
          ))}
        </div>
        {message && <p className="mt-3 text-xs text-bpPink">{message}</p>}
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
          Seguranca com Passkey
        </p>
        <div className="mt-4 rounded-2xl border border-black/10 p-4 text-sm">
          <p className="font-semibold text-bpBlackSoft">Passkey (WebAuthn)</p>
          {security.checking ? (
            <p className="mt-1 text-xs text-bpGraphite/70">Verificando disponibilidade...</p>
          ) : (
            <p className="mt-1 text-xs text-bpGraphite/70">
              {!security.passkeySupported
                ? "Este dispositivo nao suporta Passkey."
                : security.passkeyEnabled
                  ? "Passkey ativa nesta conta."
                  : "Passkey ainda nao cadastrada."}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={handleRegisterPasskey}
              disabled={!security.passkeySupported || security.busy}
              className="rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-bpGraphite disabled:opacity-50"
            >
              {security.passkeyEnabled ? "Cadastrar novamente" : "Ativar Passkey"}
            </button>
            <button
              onClick={handleValidatePasskey}
              disabled={
                !security.passkeySupported || !security.passkeyEnabled || security.busy
              }
              className="rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-bpGraphite disabled:opacity-50"
            >
              Validar Passkey
            </button>
          </div>

          {passkeys.length > 0 ? (
            <div className="mt-4 space-y-2">
              {passkeys.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-bpOffWhite/70 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-bpBlackSoft">{device.friendlyName}</p>
                    <p className="text-[11px] text-bpGraphite/70">
                      Criada em{" "}
                      {new Date(device.createdAt).toLocaleDateString("pt-BR")} - {device.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePasskey(device.id)}
                    disabled={security.busy}
                    className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-bpGraphite disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {passkeyMessage ? (
            <p className="mt-3 text-xs text-bpPink">{passkeyMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
