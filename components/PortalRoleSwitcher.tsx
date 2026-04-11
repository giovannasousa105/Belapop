"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import type { UserRole } from "@/lib/types";

type Variant = "light" | "dark";

type PortalRoleSwitcherProps = {
  variant?: Variant;
  className?: string;
  compact?: boolean;
};

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Cliente",
  seller: "Lojista",
  admin: "Admin"
};

const ROLE_TARGETS: Record<UserRole, string> = {
  customer: "/conta",
  seller: "/parceiro",
  admin: "/adm"
};

const normalizeRole = (value: unknown): UserRole => {
  if (value === "admin") return "admin";
  if (value === "seller" || value === "partner") return "seller";
  return "customer";
};

export default function PortalRoleSwitcher({
  variant = "light",
  className,
  compact = false
}: PortalRoleSwitcherProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = useMemo(() => {
    const available = new Set<UserRole>();
    if (user?.role) available.add(normalizeRole(user.role));
    for (const role of user?.roles ?? []) {
      available.add(normalizeRole(role));
    }
    return Array.from(available);
  }, [user?.role, user?.roles]);

  const activeRole = normalizeRole(user?.role ?? "customer");

  if (!user || roles.length <= 1) return null;

  const wrapClass =
    variant === "dark"
      ? "rounded-xl border border-white/20 bg-white/5"
      : "rounded-xl border border-black/15 bg-white";

  const titleClass = variant === "dark" ? "text-white/84" : "text-bpBlackSoft/75";
  const errorClass = variant === "dark" ? "text-rose-300" : "text-rose-600";

  const baseButtonClass =
    variant === "dark"
      ? "border border-white/20 text-white hover:bg-white/10"
      : "border border-black/15 bg-white text-bpBlackSoft hover:border-black/30 hover:bg-bpOffWhite";

  const activeButtonClass =
    variant === "dark"
      ? "border-bpPink/55 bg-bpPink/20 text-white"
      : "border-bpPink/50 bg-bpPinkLux text-bpBlack";

  const handleSwitch = async (nextRole: UserRole) => {
    if (isSwitching || nextRole === activeRole) return;
    setIsSwitching(true);
    setError(null);
    try {
      const response = await fetch("/api/me/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: nextRole })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Falha ao trocar perfil.")
            : `HTTP ${response.status}`
        );
      }

      router.replace(ROLE_TARGETS[nextRole]);
      router.refresh();
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Falha ao trocar perfil.");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className={`${wrapClass} ${className ?? ""}`}>
      <p className={`px-3 pt-2 text-[10px] uppercase tracking-[0.22em] ${titleClass}`}>
        Trocar painel
      </p>
      <div className={`p-2 ${compact ? "flex flex-wrap gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-3"}`}>
        {roles.map((role) => {
          const active = role === activeRole;
          return (
            <button
              key={role}
              type="button"
              onClick={() => handleSwitch(role)}
              disabled={isSwitching || active}
              className={`rounded-lg px-3 py-2 text-xs uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active ? activeButtonClass : baseButtonClass
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          );
        })}
      </div>
      {error ? <p className={`px-3 pb-2 text-xs ${errorClass}`}>{error}</p> : null}
    </div>
  );
}
