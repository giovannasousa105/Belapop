import Link from "next/link";

export type AuditRow = {
  id: string;
  type: string;
  description: string;
  priority: "critica" | "alta" | "media" | "baixa";
  date: string;
  href: string;
};

const priorityConfig = {
  critica: { label: "Critica", color: "#EF4444", bg: "#FEE2E2", border: "#EF4444" },
  alta: { label: "Alta", color: "#92400E", bg: "#FEF3C7", border: "#F59E0B" },
  media: { label: "Media", color: "#1E3A8A", bg: "#DBEAFE", border: "transparent" },
  baixa: { label: "Baixa", color: "#6B7280", bg: "#F3F4F6", border: "transparent" }
};

function shortCode(value: string) {
  return `${value.replace(/^#/, "").slice(0, 8)}...`;
}

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white">
      <table className="w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {["Codigo", "Tipo", "Descricao", "Prioridade", "Data", "Acao"].map((heading, index) => (
              <th
                key={heading}
                className={`border-b border-[rgba(139,94,60,0.14)] bg-[#F4F1ED] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589] ${
                  index === 5 ? "text-right" : ""
                } ${index === 0 ? "rounded-tl-xl" : ""} ${index === 5 ? "rounded-tr-xl" : ""}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const priority = priorityConfig[row.priority];

            return (
              <tr key={row.id} className="transition-colors hover:bg-[rgba(139,94,60,0.08)]">
                <td
                  className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 font-mono text-[12px] text-[#1A1714]"
                  style={{ borderLeft: `3px solid ${priority.border}` }}
                >
                  {shortCode(row.id)}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm font-medium text-[#1A1714]">
                  {row.type}
                </td>
                <td className="max-w-[420px] border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm text-[#6B5E54]">
                  <span className="line-clamp-2">{row.description}</span>
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: priority.color, background: priority.bg }}
                  >
                    {priority.label}
                  </span>
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm text-[#9E9589]">
                  {row.date}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right">
                  <Link href={row.href} className="text-[12px] font-semibold text-[#8B5E3C] hover:text-[#7A5234]">
                    Revisar
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4 text-sm font-bold text-[#1A1714]" colSpan={5}>
              Total
            </td>
            <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4 text-right text-sm font-bold text-[#1A1714]">
              {rows.length}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
