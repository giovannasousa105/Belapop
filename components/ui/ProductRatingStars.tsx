import { Star } from "lucide-react";

import { getProductRatingDisplay } from "@/lib/product/productRating";

export function ProductRatingStars({ seed, className = "" }: { seed: string; className?: string }) {
  const { stars, count } = getProductRatingDisplay(seed);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5 text-black">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="h-3 w-3"
            fill={index < Math.round(stars) ? "currentColor" : "none"}
            stroke="currentColor"
          />
        ))}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-black/55">
        {stars.toFixed(1)} ({count})
      </span>
    </div>
  );
}
