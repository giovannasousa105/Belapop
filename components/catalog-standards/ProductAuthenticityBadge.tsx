import { AuthenticityBadge } from "@/components/catalog-standards/AuthenticityBadge";
import type { ProductAuthenticity } from "@/lib/catalog-standards";

type ProductAuthenticityBadgeProps = {
  authenticity: ProductAuthenticity;
  className?: string;
  compact?: boolean;
};

export function ProductAuthenticityBadge({ authenticity, className = "", compact = false }: ProductAuthenticityBadgeProps) {
  return <AuthenticityBadge authenticity={authenticity} className={className} compact={compact} />;
}
