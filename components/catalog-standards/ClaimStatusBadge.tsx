import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

type ClaimStatusBadgeProps = {
  className?: string;
  status: "allowed" | "blocked" | "review";
};

const config = {
  allowed: {
    icon: CheckCircle2,
    label: "Claim permitido",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800"
  },
  blocked: {
    icon: AlertTriangle,
    label: "Claim bloqueado",
    tone: "border-rose-200 bg-rose-50 text-rose-800"
  },
  review: {
    icon: Clock3,
    label: "Revisao necessaria",
    tone: "border-amber-200 bg-amber-50 text-amber-900"
  }
} as const;

export function ClaimStatusBadge({ className = "", status }: ClaimStatusBadgeProps) {
  const current = config[status];
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${current.tone} ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {current.label}
    </span>
  );
}
