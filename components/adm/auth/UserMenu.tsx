"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, RefreshCcw } from "lucide-react";

import type { AdmChromeVariant } from "@/lib/adm/dashboardTheme";
import type { AdmMockProfileOption, AuthenticatedAdmUser } from "@/types/adm/auth";

type UserMenuProps = {
  user: AuthenticatedAdmUser;
  roleLabel: string;
  mockProfiles: AdmMockProfileOption[];
  showMockSwitcher: boolean;
  variant?: AdmChromeVariant;
};

type SwitchState = {
  busy: boolean;
  error: string | null;
};

export function UserMenu({
  user,
  roleLabel,
  mockProfiles,
  showMockSwitcher,
  variant = "default"
}: UserMenuProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [switchState, setSwitchState] = useState<SwitchState>({
    busy: false,
    error: null
  });

  const availableProfiles = useMemo(
    () => mockProfiles.filter((profile) => profile.id !== user.id),
    [mockProfiles, user.id]
  );
  const isWorkspaceVariant = variant === "workspace";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleLogout = async () => {
    setLogoutBusy(true);
    try {
      const response = await fetch("/api/adm/auth/logout", {
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string }
        | null;

      router.replace(payload?.redirectTo ?? "/adm/login?reason=signed-out");
      router.refresh();
    } finally {
      setLogoutBusy(false);
      setOpen(false);
    }
  };

  const handleSwitchProfile = async (profileId: string) => {
    setSwitchState({
      busy: true,
      error: null
    });

    try {
      const response = await fetch("/api/adm/auth/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: profileId
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setSwitchState({
          busy: false,
          error: payload?.error ?? "Nao foi possivel trocar o perfil."
        });
        return;
      }

      router.replace(payload.redirectTo ?? "/adm");
      router.refresh();
      setOpen(false);
      setSwitchState({
        busy: false,
        error: null
      });
    } catch {
      setSwitchState({
        busy: false,
        error: "Nao foi possivel trocar o perfil."
      });
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-3 border border-[var(--adm-border)] bg-white px-2 py-1.5 text-left shadow-[var(--adm-shadow-micro)] ${
          isWorkspaceVariant ? "rounded-2xl" : "rounded-full"
        }`}
      >
        <span
          className={`flex h-10 w-10 items-center justify-center text-sm font-semibold uppercase ${
            isWorkspaceVariant
              ? "rounded-xl bg-[var(--adm-surface-soft)] text-[var(--adm-primary)]"
              : "rounded-full bg-[var(--adm-text)] text-[#f8f5ef]"
          }`}
        >
          {user.name.slice(0, 1)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-[var(--adm-text)]">{user.name}</span>
          <span className="block text-[11px] uppercase tracking-[0.16em] text-[var(--adm-text-soft)]">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-[var(--adm-text-soft)]" />
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-[calc(100%+12px)] z-40 w-[320px] border border-[var(--adm-border)] p-4 ${
            isWorkspaceVariant
              ? "rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
              : "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,242,235,0.96))] shadow-[0_28px_80px_rgba(32,30,28,0.16)]"
          }`}
        >
          <div
            className={`border border-[var(--adm-border)] p-4 ${
              isWorkspaceVariant ? "rounded-2xl bg-[var(--adm-surface-muted)]" : "rounded-2xl bg-white/85"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--adm-text-soft)]">Sessao atual</p>
            <p className="mt-2 text-sm font-semibold text-[var(--adm-text)]">{user.email}</p>
            <p className="mt-1 text-xs text-[var(--adm-text-muted)]">
              {roleLabel}
              {user.lastLoginAt
                ? ` | ultimo acesso ${new Date(user.lastLoginAt).toLocaleDateString("pt-BR")}`
                : ""}
            </p>
          </div>

          {showMockSwitcher && availableProfiles.length > 0 ? (
            <div
              className={`mt-4 rounded-2xl border border-[var(--adm-border)] p-4 ${
                isWorkspaceVariant ? "bg-white" : "bg-white/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-[var(--adm-text-muted)]" />
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--adm-text-soft)]">
                  Troca local de perfil
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {availableProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSwitchProfile(profile.id)}
                    disabled={switchState.busy}
                    className={`flex w-full items-center justify-between rounded-2xl border border-[var(--adm-border)] px-3 py-2 text-left transition disabled:opacity-60 ${
                      isWorkspaceVariant
                        ? "bg-[var(--adm-surface-muted)] hover:border-[var(--adm-border-strong)] hover:bg-[var(--adm-surface-soft)]"
                        : "bg-[#fcfbf8] hover:border-[var(--adm-border-strong)]"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[var(--adm-text)]">
                        {profile.name}
                      </span>
                      <span className="block text-[11px] uppercase tracking-[0.16em] text-[var(--adm-text-soft)]">
                        {profile.roleLabel}
                      </span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--adm-text-muted)]">
                      Ativar
                    </span>
                  </button>
                ))}
              </div>
              {switchState.error ? (
                <p className="mt-3 text-xs text-[#7a3832]">{switchState.error}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutBusy}
            className={`mt-4 flex w-full items-center justify-center gap-2 border border-[var(--adm-border)] bg-[var(--adm-text)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#faf7f1] disabled:opacity-60 ${
              isWorkspaceVariant ? "rounded-xl" : "rounded-full"
            }`}
          >
            <LogOut className="h-4 w-4" />
            Encerrar sessao
          </button>
        </div>
      ) : null}
    </div>
  );
}
