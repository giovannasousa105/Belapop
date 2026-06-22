"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

const WHATSAPP_ICON_PATH =
  "M16.003 3C9.376 3 4 8.373 4 15c0 2.39.7 4.616 1.91 6.49L4 29l7.71-1.86A11.93 11.93 0 0 0 16.003 27C22.63 27 28 21.627 28 15S22.63 3 16.003 3Zm0 21.6c-1.94 0-3.74-.52-5.29-1.43l-.38-.22-3.65.88.93-3.58-.25-.37A9.55 9.55 0 0 1 6.4 15c0-5.3 4.31-9.6 9.6-9.6 5.3 0 9.6 4.3 9.6 9.6 0 5.3-4.3 9.6-9.6 9.6Zm5.27-7.18c-.29-.14-1.71-.84-1.97-.94-.27-.1-.46-.14-.65.14-.19.29-.74.94-.91 1.13-.17.19-.34.21-.62.07-.29-.14-1.21-.45-2.31-1.43-.85-.76-1.43-1.7-1.6-1.98-.17-.29-.02-.45.13-.59.14-.13.31-.34.46-.51.15-.17.2-.29.3-.48.1-.19.05-.36-.03-.5-.08-.14-.6-1.45-.82-1.99-.22-.53-.45-.46-.62-.47-.16-.01-.34-.01-.53-.01-.19 0-.48.07-.74.36-.26.29-1 1-.99 2.42.01 1.42 1.02 2.8 1.17 3 .15.19 1.97 3.02 4.78 4.11 2.81 1.09 2.81.73 3.32.68.51-.05 1.71-.7 1.95-1.39.24-.69.24-1.27.17-1.39-.07-.13-.27-.2-.55-.34Z";

export function ProductShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${getShareUrl()}`)}`;

  return (
    <div className="flex items-center gap-2.5 border-t border-black/10 pt-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/70">
        Compartilhar
      </span>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no WhatsApp"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:border-black/30 hover:text-black"
      >
        <svg viewBox="0 0 32 32" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
          <path d={WHATSAPP_ICON_PATH} />
        </svg>
      </a>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Compartilhar produto"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:border-black/30 hover:text-black"
      >
        <Share2 className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="Copiar link do produto"
        className="flex h-11 items-center gap-2 rounded-full border border-black/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/70 transition hover:border-black/30 hover:text-black"
      >
        <Link2 className="h-4 w-4" />
        {copied ? "Link copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
