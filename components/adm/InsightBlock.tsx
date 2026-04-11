type InsightBlockProps = {
  title: string;
  value: string;
  note?: string;
};

export function InsightBlock({ title, value, note }: InsightBlockProps) {
  return (
    <article className="rounded-2xl border border-[#d6d2ca] bg-[#f8f7f3] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#756f67]">{title}</p>
      <p className="mt-2 font-editorial text-2xl text-[#25221f]">{value}</p>
      {note ? <p className="mt-2 text-xs text-[#6e675f]">{note}</p> : null}
    </article>
  );
}
