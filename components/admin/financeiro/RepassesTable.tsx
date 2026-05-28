import Link from "next/link";

export type RepasseRow = {
  id: string;
  seller: string;
  period: string;
  gmv: string;
  takeRate: string;
  netAmount: string;
  status: "pendente" | "processando" | "pago" | "bloqueado" | "agendado";
  href: string;
};

const statusConfig = {
  pendente: { color: "#92400E", bg: "#FEF3C7", label: "Pendente" },
  processando: { color: "#1E3A8A", bg: "#DBEAFE", label: "Processando" },
  pago: { color: "#065F46", bg: "#D1FAE5", label: "Pago" },
  bloqueado: { color: "#7F1D1D", bg: "#FEE2E2", label: "Bloqueado" },
  agendado: { color: "#4A2800", bg: "#FDE8D0", label: "Agendado" }
};

export function RepassesTable({ rows, totalNetAmount }: { rows: RepasseRow[]; totalNetAmount: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white">
      <table className="w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {["Seller", "Periodo", "GMV", "Take Rate", "Valor Liquido", "Status", "Acoes"].map((heading, index) => (
              <th
                key={heading}
                className={`border-b border-[rgba(139,94,60,0.14)] bg-[#F4F1ED] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589] ${
                  index === 2 || index === 4 ? "text-right" : ""
                } ${index === 0 ? "rounded-tl-xl" : ""} ${index === 6 ? "rounded-tr-xl text-right" : ""}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = statusConfig[row.status];

            return (
              <tr key={row.id} className="transition-colors hover:bg-[rgba(139,94,60,0.08)]">
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm font-semibold text-[#1A1714]">
                  {row.seller}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm text-[#6B5E54]">
                  {row.period}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right text-sm text-[#1A1714] [font-variant-numeric:tabular-nums]">
                  {row.gmv}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm text-[#9E9589]">
                  {row.takeRate}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right text-sm font-bold text-[#1A1714] [font-variant-numeric:tabular-nums]">
                  {row.netAmount}
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: status.color, background: status.bg }}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right">
                  <Link href={row.href} className="text-[12px] font-semibold text-[#8B5E3C] hover:text-[#7A5234]">
                    Detalhar
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4 text-sm font-bold text-[#1A1714]" colSpan={4}>
              Total
            </td>
            <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4 text-right text-sm font-bold text-[#1A1714] [font-variant-numeric:tabular-nums]">
              {totalNetAmount}
            </td>
            <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4" colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
