"use client";

type Props = { status: string };

const COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  scheduled: "bg-sky-100 text-sky-800 border-sky-200",
  expired: "bg-bpOffWhite text-bpGraphite border-bpBlack/20",
  inactive: "bg-bpOffWhite text-bpGraphite border-bpBlack/20",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paused: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  shipped: "bg-sky-100 text-sky-800 border-sky-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export function StatusBadge({ status }: Props) {
  const key = status?.toLowerCase?.() ?? "active";
  const color = COLORS[key] ?? "bg-bpOffWhite text-bpGraphite border-bpBlack/20";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.25em] ${color}`}
    >
      {status}
    </span>
  );
}
