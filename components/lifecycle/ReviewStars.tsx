"use client";

import { Star } from "lucide-react";

type ReviewStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
};

export function ReviewStars({ value, onChange, readOnly = false }: ReviewStarsProps) {
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = rating <= value;
        return (
          <button
            key={rating}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(rating)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-[#8e5b68] disabled:cursor-default"
            aria-label={`Dar nota ${rating}`}
          >
            <Star
              className={`h-4 w-4 ${active ? "fill-[#8e5b68] text-[#8e5b68]" : "text-black/32"}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
