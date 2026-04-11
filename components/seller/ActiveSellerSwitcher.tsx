"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";

type Variant = "light" | "dark";

type ActiveSellerSwitcherProps = {
  variant?: Variant;
  className?: string;
};

const formatMemberRole = (value: string | null | undefined) => {
  if (!value) return "Membro";
  if (value === "ADMIN") return "Admin";
  if (value === "OPERACAO") return "Operacao";
  if (value === "FINANCEIRO") return "Financeiro";
  return value;
};

export default function ActiveSellerSwitcher({
  variant = "light",
  className
}: ActiveSellerSwitcherProps) {
  const { user, switchSeller } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sellerProfiles = useMemo(
    () => (user?.sellerProfiles ?? []).filter((profile) => Boolean(profile.sellerId)),
    [user?.sellerProfiles]
  );

  if (!user || sellerProfiles.length <= 1) return null;

  const activeSeller = user.sellerProfile ?? sellerProfiles[0];
  const activeSellerId = activeSeller?.sellerId ?? "";
  const panelClass =
    variant === "dark"
      ? "rounded-2xl border border-white/12 bg-white/5 p-3"
      : "rounded-2xl border border-black/10 bg-white p-4 shadow-sm";
  const labelClass =
    variant === "dark"
      ? "text-[10px] uppercase tracking-[0.24em] text-white/60"
      : "text-[10px] uppercase tracking-[0.24em] text-bpGraphite/65";
  const selectClass =
    variant === "dark"
      ? "mt-2 w-full rounded-xl border border-white/15 bg-[#12141a] px-3 py-2 text-sm text-white outline-none transition focus:border-bpPink"
      : "mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-bpBlackSoft outline-none transition focus:border-bpPink";
  const metaClass = variant === "dark" ? "text-xs text-white/72" : "text-xs text-bpGraphite/80";
  const errorClass = variant === "dark" ? "text-xs text-rose-300" : "text-xs text-rose-600";

  const handleChange = async (nextSellerId: string) => {
    if (!nextSellerId || nextSellerId === activeSellerId || isPending) return;

    setError(null);
    const result = await switchSeller(nextSellerId);
    if (!result.ok) {
      setError(result.message ?? "Nao foi possivel trocar a loja ativa.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className={`${panelClass} ${className ?? ""}`}>
      <p className={labelClass}>Loja ativa</p>
      <select
        value={activeSellerId}
        onChange={(event) => void handleChange(event.target.value)}
        disabled={isPending}
        className={selectClass}
      >
        {sellerProfiles.map((profile) => (
          <option key={profile.sellerId} value={profile.sellerId}>
            {profile.storeName || "Loja sem nome"}
          </option>
        ))}
      </select>
      <p className={`mt-2 ${metaClass}`}>
        {activeSeller?.isOwner ? "Owner" : formatMemberRole(activeSeller?.memberRole)}{" "}
        {activeSeller?.status ? `• ${activeSeller.status}` : ""}
      </p>
      {error ? <p className={`mt-2 ${errorClass}`}>{error}</p> : null}
    </div>
  );
}
