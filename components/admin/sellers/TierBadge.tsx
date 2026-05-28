export type SellerTier =
  | "newcomer"
  | "rising-star"
  | "elite-curator"
  | "rising"
  | "premium"
  | "elite"
  | "core";

const tierConfig: Record<SellerTier, { label: string; mark: string; color: string; bg: string }> = {
  newcomer: { label: "Newcomer", mark: "N", color: "#6B6560", bg: "#F0EFED" },
  "rising-star": { label: "Rising Star", mark: "*", color: "#92400E", bg: "#FEF3C7" },
  "elite-curator": {
    label: "Elite Curator",
    mark: "+",
    color: "#4A2800",
    bg: "linear-gradient(135deg, #F5D0A9, #E8C4A0)"
  },
  rising: { label: "Rising Star", mark: "*", color: "#92400E", bg: "#FEF3C7" },
  premium: {
    label: "Elite Curator",
    mark: "+",
    color: "#4A2800",
    bg: "linear-gradient(135deg, #F5D0A9, #E8C4A0)"
  },
  elite: {
    label: "Elite Curator",
    mark: "+",
    color: "#4A2800",
    bg: "linear-gradient(135deg, #F5D0A9, #E8C4A0)"
  },
  core: { label: "Newcomer", mark: "N", color: "#6B6560", bg: "#F0EFED" }
};

export function TierBadge({ tier }: { tier: SellerTier }) {
  const cfg = tierConfig[tier] ?? tierConfig.newcomer;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span aria-hidden="true">{cfg.mark}</span>
      {cfg.label}
    </span>
  );
}
