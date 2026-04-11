type QueueItem = {
  id: string;
  area: string;
  count: number;
  sla: string;
  href: string;
};

export default function OpsQueue({ items }: { items: QueueItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">{item.area}</p>
            <p className="mt-1 text-xs text-slate-500">SLA {item.sla}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
              {item.count}
            </span>
            <a
              href={item.href}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              Abrir
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
