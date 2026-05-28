export type SellerMetric = {
  label: string;
  value: string;
};

export function SellerMetricsGrid({ metrics }: { metrics: SellerMetric[] }) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-[rgba(139,94,60,0.07)] bg-[rgba(139,94,60,0.07)]">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col gap-1 bg-[#F4F1ED] px-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9E9589]">
            {metric.label}
          </span>
          <span className="text-[15px] font-bold text-[#1A1714] [font-variant-numeric:tabular-nums]">
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}
