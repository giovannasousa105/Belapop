import Link from "next/link";

export type AlertSeverity = "critica" | "alta" | "media" | "baixa";

export type AlertFeedItem = {
  id: string;
  code: string;
  /** @deprecated pass title + description separately */
  message?: string;
  title?: string;
  description?: string;
  action?: string;
  actionHref?: string;
  severity?: AlertSeverity;
  timestamp: string;
};

export type AlertFeedProps = {
  title?: string;
  items: AlertFeedItem[];
  href?: string;
};

const severityConfig: Record<
  AlertSeverity,
  {
    dot: string;
    pulse: boolean;
    cardBg: string;
    cardBorder: string;
    titleColor: string;
    badgeBg: string;
    badgeText: string;
    actionBg: string;
    actionText: string;
    label: string;
  }
> = {
  critica: {
    dot: "bg-red-500",
    pulse: true,
    cardBg: "bg-red-50",
    cardBorder: "border-red-200",
    titleColor: "text-red-800",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    actionBg: "bg-red-100 hover:bg-red-200",
    actionText: "text-red-700",
    label: "Crítica",
  },
  alta: {
    dot: "bg-amber-500",
    pulse: false,
    cardBg: "bg-amber-50/60",
    cardBorder: "border-amber-200",
    titleColor: "text-amber-800",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    actionBg: "bg-amber-100 hover:bg-amber-200",
    actionText: "text-amber-700",
    label: "Alta",
  },
  media: {
    dot: "bg-yellow-500",
    pulse: false,
    cardBg: "bg-yellow-50/40",
    cardBorder: "border-yellow-200",
    titleColor: "text-yellow-800",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    actionBg: "bg-yellow-100 hover:bg-yellow-200",
    actionText: "text-yellow-700",
    label: "Média",
  },
  baixa: {
    dot: "bg-stone-400",
    pulse: false,
    cardBg: "bg-stone-50",
    cardBorder: "border-stone-200",
    titleColor: "text-stone-700",
    badgeBg: "bg-stone-100",
    badgeText: "text-stone-600",
    actionBg: "bg-stone-100 hover:bg-stone-200",
    actionText: "text-stone-600",
    label: "Baixa",
  },
};

export function AlertFeed({
  title = "Alertas Operacionais",
  items,
  href,
}: AlertFeedProps) {
  const critCount = items.filter((i) => (i.severity ?? "alta") === "critica").length;
  const totalCount = items.length;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(139,94,60,0.07)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[13px] font-semibold text-[#1A1714]">{title}</h3>
          {critCount > 0 && (
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold leading-none text-red-700">
              ● {critCount} crítico{critCount > 1 ? "s" : ""}
            </span>
          )}
          {totalCount > 0 && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium leading-none text-stone-500">
              {totalCount} total
            </span>
          )}
        </div>
        {href ? (
          <Link
            href={href}
            className="text-[11px] font-semibold text-[#8B5E3C] transition hover:text-[#6B4428]"
          >
            Ver todos →
          </Link>
        ) : null}
      </div>

      {/* Alert cards */}
      <div className="flex flex-col gap-2.5 p-3">
        {items.map((item) => {
          const sev = item.severity ?? "alta";
          const cfg = severityConfig[sev];

          // Resolve title and description: prefer explicit fields, fall back to splitting message
          let resolvedTitle = item.title;
          let resolvedDescription = item.description;
          if (!resolvedTitle && item.message) {
            const parts = item.message.split(" — ");
            resolvedTitle = parts[0] ?? item.message;
            resolvedDescription = parts.slice(1).join(" — ") || undefined;
          }

          const ActionEl = item.actionHref ? (
            <Link
              href={item.actionHref}
              className={`shrink-0 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${cfg.actionBg} ${cfg.actionText}`}
            >
              {item.action ?? "Ver detalhes"} →
            </Link>
          ) : item.action ? (
            <button
              type="button"
              className={`shrink-0 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${cfg.actionBg} ${cfg.actionText}`}
            >
              {item.action} →
            </button>
          ) : null;

          return (
            <div
              key={item.id}
              className={`relative rounded-xl border p-3.5 transition-all ${cfg.cardBg} ${cfg.cardBorder}`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`mt-[3px] h-2 w-2 shrink-0 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`}
                  />
                  <span className={`text-[13px] font-semibold leading-snug ${cfg.titleColor}`}>
                    {resolvedTitle}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-stone-400">
                  {item.timestamp}
                </span>
              </div>

              {/* Description */}
              {resolvedDescription && (
                <p className="ml-4 mt-1 text-[12px] leading-snug text-stone-600">
                  {resolvedDescription}
                </p>
              )}

              {/* Footer: code + action */}
              <div className="ml-4 mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <code className="text-[10px] font-mono text-stone-400">{item.code}</code>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide ${cfg.badgeBg} ${cfg.badgeText}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                {ActionEl}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="py-6 text-center text-[13px] text-stone-400">
            Nenhum alerta no momento
          </p>
        )}
      </div>
    </div>
  );
}
