import Image from "next/image";

import { PREMIUM_PRODUCT_PLACEHOLDER } from "@/lib/catalog-standards";

type PremiumImagePlaceholderProps = {
  className?: string;
};

export function PremiumImagePlaceholder({ className = "" }: PremiumImagePlaceholderProps) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-[8px] border border-black/10 bg-[#f7f1ea] ${className}`}>
      <Image
        src={PREMIUM_PRODUCT_PLACEHOLDER.url}
        alt={PREMIUM_PRODUCT_PLACEHOLDER.alt}
        fill
        sizes="(min-width: 768px) 360px, 90vw"
        className="object-cover"
      />
    </div>
  );
}
