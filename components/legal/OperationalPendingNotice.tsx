import { operationalPendingItems } from "@/lib/legal/content";

type OperationalPendingNoticeProps = {
  title?: string;
  items?: readonly string[];
  className?: string;
};

export function OperationalPendingNotice({
  title = "Pendente de validacao operacional",
  items = operationalPendingItems,
  className = ""
}: OperationalPendingNoticeProps) {
  if (!items.length) return null;

  return (
    <section
      className={`rounded-[28px] border border-[#d7c3c6] bg-[#fff6f7] p-5 text-[#3d3536] sm:p-6 ${className}`}
      aria-label={title}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-[#5b4f50]">
        Alguns dados dependem de confirmacao operacional da BelaPop antes da publicacao definitiva.
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-[#5b4f50]">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
