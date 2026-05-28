import Link from "next/link";

export type AlertSeverity = "critica" | "alta" | "media" | "baixa";

export type AlertFeedItem = {
  id: string;
  code: string;
  message: string;
  severity?: AlertSeverity;
  timestamp: string;
};

export type AlertFeedProps = {
  title?: string;
  items: AlertFeedItem[];
  href?: string;
};

const severityDot: Record<AlertSeverity, string> = {
  critica: "bg-[#EF4444]",
  alta:    "bg-[#F59E0B]",
  media:   "bg-[#3B82F6]",
  baixa:   "bg-[#9E9589]",
};

const severityBadge: Record<AlertSeverity, string> = {
  critica: "bg-[#FEE2E2] text-[#EF4444]",
  alta:    "bg-[#FEF3C7] text-[#D97706]",
  media:   "bg-[#DBEAFE] text-[#3B82F6]",
  baixa:   "bg-[#F4F1ED] text-[#9E9589]",
};

const severityLabel: Record<AlertSeverity, string> = {
  critica: "Crítica",
  alta:    "Alta",
  media:   "Média",
  baixa:   "Baixa",
};

export function AlertFeed({
  title = "Alertas Operacionais",
  items,
  href,
}: AlertFeedProps) {
  const critCount = items.filter((i) => (i.severity ?? "alta") === "critica").length;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(139,94,60,0.07)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[13px] font-semibold text-[#1A1714]">{title}</h3>
          {critCount > 0 ? (
            <span className="rounded-full bg-[#EF4444] px-2 py-0.5 text-[10px] font-bold leading-none text-white">
              {critCount}
            </span>
          ) : null}
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

      {/* List */}
      <div className="max-h-[320px] divide-y divide-[rgba(139,94,60,0.05)] overflow-y-auto">
        {items.map((item) => {
          const sev = item.severity ?? "alta";
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#F8F5F1]"
            >
              <span
                className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${severityDot[sev]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <code className="shrink-0 font-mono text-[11px] text-[#9E9589]">
                      {item.code}
                    </code>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${severityBadge[sev]}`}
                    >
                      {severityLabel[sev]}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-[#9E9589]">
                    {item.timestamp}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#6B5E54]">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
