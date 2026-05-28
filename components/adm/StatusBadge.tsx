import type { AdminVisualStatus } from "@/types/adm";

const classesByStatus: Record<AdminVisualStatus, string> = {
  aprovado:    "border-emerald-200 bg-emerald-50 text-emerald-800",
  "em-revisao":"border-amber-200 bg-amber-50 text-amber-800",
  pendente:    "border-stone-200 bg-stone-100 text-stone-700",
  reprovado:   "border-rose-200 bg-rose-50 text-rose-800",
  critico:     "border-red-200 bg-red-50 text-red-800",
  alerta:      "border-orange-200 bg-orange-50 text-orange-800",
  resolvido:   "border-sky-200 bg-sky-50 text-sky-800",
  bloqueado:   "border-zinc-300 bg-zinc-200 text-zinc-900",
  premium:     "border-neutral-900 bg-neutral-900 text-neutral-50",
  destaque:    "border-violet-200 bg-violet-50 text-violet-800",
  ok:          "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]",
  warning:     "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
  danger:      "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]",
  info:        "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]",
  blocked:     "border-[#FECACA] bg-[#FEE2E2] text-[#7F1D1D]",
  monitoring:  "border-[#BAE6FD] bg-[#E0F2FE] text-[#0369A1]",
  critical:    "border-[#991B1B] bg-[#991B1B] text-white",
};

const labelByStatus: Record<AdminVisualStatus, string> = {
  aprovado:    "Aprovado",
  "em-revisao":"Em revisão",
  pendente:    "Pendente",
  reprovado:   "Reprovado",
  critico:     "Crítico",
  alerta:      "Alerta",
  resolvido:   "Resolvido",
  bloqueado:   "Bloqueado",
  premium:     "Premium",
  destaque:    "Destaque",
  ok:          "OK",
  warning:     "Revisão",
  danger:      "Bloqueio",
  info:        "Monitorando",
  blocked:     "Bloqueado",
  monitoring:  "Monitorando",
  critical:    "Crítico",
};

type StatusBadgeProps = {
  status: AdminVisualStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${classesByStatus[status]} ${
        className ?? ""
      }`}
    >
      {labelByStatus[status]}
    </span>
  );
}
