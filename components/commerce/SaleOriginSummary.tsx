type SaleOriginSummaryProps = {
  sellerName?: string | null;
  saleOrigin?: "própria" | "marketplace" | null;
  sellerStatus?: string | null;
  compact?: boolean;
};

const belaPopFolded = "BelaPop".toLowerCase();

function resolveOriginLabel(saleOrigin: SaleOriginSummaryProps["saleOrigin"], sellerName: string) {
  if (saleOrigin === "própria" || sellerName.toLowerCase() === belaPopFolded) {
    return "Venda própria BelaPop";
  }

  return "Marketplace curado BelaPop";
}

function resolveResponsibility(saleOrigin: SaleOriginSummaryProps["saleOrigin"], sellerName: string) {
  if (saleOrigin === "própria" || sellerName.toLowerCase() === belaPopFolded) {
    return "Atendimento, envio e pos-venda conduzidos pela BelaPop.";
  }

  return `Envio e pos-venda conduzidos por ${sellerName}, com acompanhamento pela BelaPop.`;
}

export function SaleOriginSummary({
  sellerName,
  saleOrigin,
  compact = false
}: SaleOriginSummaryProps) {
  const normalizedSellerName = sellerName?.trim() || "BelaPop";

  return (
    <div
      className={`border border-black/10 bg-white/70 ${compact ? "px-4 py-4" : "px-5 py-5"} ${
        compact ? "space-y-3" : "space-y-4"
      }`}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/52">
          Origem da venda
        </p>
        <p className="mt-1 text-sm leading-relaxed text-black/76">
          {resolveOriginLabel(saleOrigin, normalizedSellerName)}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/52">
          Vendido por
        </p>
        <p className="mt-1 text-sm leading-relaxed text-black/76">{normalizedSellerName}</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/52">
          Pos-venda e responsabilidade
        </p>
        <p className="mt-1 text-sm leading-relaxed text-black/76">
          {resolveResponsibility(saleOrigin, normalizedSellerName)}
        </p>
      </div>
    </div>
  );
}
