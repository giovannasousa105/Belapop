"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function SellerHighlightOnLoad() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("seller");

  useEffect(() => {
    if (!sellerId) return;

    const el = document.getElementById(`seller-${sellerId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#8B5E3C]", "ring-offset-2");

    const timeoutId = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-[#8B5E3C]", "ring-offset-2");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [sellerId]);

  return null;
}
