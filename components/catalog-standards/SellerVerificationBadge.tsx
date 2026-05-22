import { SellerQualityBadge } from "@/components/catalog-standards/SellerQualityBadge";
import type { SellerQualityStandard } from "@/lib/catalog-standards";

type SellerVerificationBadgeProps = {
  className?: string;
  seller: SellerQualityStandard;
};

export function SellerVerificationBadge({ className = "", seller }: SellerVerificationBadgeProps) {
  return <SellerQualityBadge className={className} score={seller.qualityScore} status={seller.status} />;
}
