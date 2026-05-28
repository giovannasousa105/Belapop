export type RefundCardData = {
  id: string;
  orderId: string;
  requestedAt: string;
  reason: string;
  customerName: string;
  sellerName: string;
  daysOpen: number;
  amount: string;
};

function shortId(value: string) {
  return `${value.replace(/^#/, "").slice(0, 8)}...`;
}

export function RefundCard({ refund }: { refund: RefundCardData }) {
  const overdue = refund.daysOpen > 7;

  return (
    <article className="flex items-center justify-between gap-6 rounded-xl border border-[rgba(139,94,60,0.07)] bg-white px-5 py-4 transition-colors hover:border-[rgba(139,94,60,0.30)]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <code className="rounded-md bg-[#F4F1ED] px-2 py-1 font-mono text-[12px] text-[#1A1714]">
            {shortId(refund.orderId)}
          </code>
          <span className="text-xs text-[#9E9589]">{refund.requestedAt}</span>
        </div>
        <p className="mt-3 text-sm font-medium text-[#1A1714]">{refund.reason}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9E9589]">
          <span>{refund.customerName}</span>
          <span aria-hidden="true">.</span>
          <span>{refund.sellerName}</span>
          <span aria-hidden="true">.</span>
          <span className={overdue ? "font-semibold text-[#EF4444]" : undefined}>
            {refund.daysOpen} dias aberto
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-['Cormorant_Garamond'] text-[22px] font-semibold text-[#1A1714] [font-variant-numeric:tabular-nums]">
          {refund.amount}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-[rgba(139,94,60,0.14)] bg-transparent px-4 py-2 text-[13px] font-semibold text-[#6B5E54] transition hover:border-[#6EE7B7] hover:bg-[#D1FAE5] hover:text-[#065F46]"
          >
            Aprovar
          </button>
          <button
            type="button"
            className="rounded-lg border border-[rgba(139,94,60,0.14)] bg-transparent px-4 py-2 text-[13px] font-semibold text-[#6B5E54] transition hover:border-[#FCA5A5] hover:bg-[#FEE2E2] hover:text-[#EF4444]"
          >
            Recusar
          </button>
        </div>
      </div>
    </article>
  );
}
