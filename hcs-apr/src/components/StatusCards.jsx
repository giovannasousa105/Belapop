export default function StatusCards({ priorities }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {priorities.map((item) => (
        <div
          key={item.title}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{item.title}</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-4xl font-semibold tracking-tight text-slate-900">{item.value}</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {item.note}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
