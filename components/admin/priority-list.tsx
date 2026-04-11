type Priority = {
  id: string;
  title: string;
  meta: string;
  severity: "high" | "medium" | "low";
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
};

const badgeTone = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-slate-200 bg-slate-50 text-slate-700"
} as const;

const severityLabel = {
  high: "Critico",
  medium: "Atencao",
  low: "Info"
} as const;

export default function PriorityList({ items }: { items: Priority[] }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        Nenhuma prioridade critica no momento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeTone[item.severity]}`}>
              {severityLabel[item.severity]}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500">{item.meta}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={item.primaryActionHref}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              {item.primaryActionLabel}
            </a>
            <a
              href={item.secondaryActionHref}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-100"
            >
              {item.secondaryActionLabel}
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
