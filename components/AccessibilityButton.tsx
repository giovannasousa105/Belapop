"use client";

import { useCallback } from "react";

const triggerSelectors = [
  "#acsb-trigger",
  ".acsb-trigger",
  "[data-acsb-trigger]",
  "[data-acsb='trigger']",
  "#acsb-accessibility-trigger"
];

export function AccessibilityButton() {
  const openWidget = useCallback(() => {
    if (typeof document === "undefined") return;

    const api = (window as Window & { acsbJS?: { open?: () => void; toggle?: () => void } })
      .acsbJS;
    if (api?.open) {
      api.open();
      return;
    }
    if (api?.toggle) {
      api.toggle();
      return;
    }

    for (const selector of triggerSelectors) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        el.click();
        return;
      }
    }
  }, []);

  return (
    <button
      type="button"
      onClick={openWidget}
      aria-label="Acessibilidade"
      className="fixed bottom-6 left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-pink-300 bg-white text-[12px] font-bold text-bpBlackSoft shadow-lg shadow-black/10 transition hover:-translate-y-[1px] hover:shadow-xl md:bottom-6 md:left-6 md:h-12 md:w-12"
    >
      A
    </button>
  );
}
