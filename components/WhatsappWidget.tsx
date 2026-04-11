"use client";

import { MessageCircle } from "lucide-react";
import { sanitizePublicEnvValue } from "@/lib/publicEnv";

type WhatsappWidgetProps = {
  phone?: string;
};

const DEFAULT_TEXT = "Ol%C3%A1%2C%20quero%20falar%20com%20o%20concierge%20BelaPop";

export function WhatsappWidget({ phone }: WhatsappWidgetProps) {
  const targetPhone = sanitizePublicEnvValue(phone || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);

  if (!targetPhone) {
    return null;
  }

  const href = `https://wa.me/${targetPhone.replace(/\D/g, "")}?text=${DEFAULT_TEXT}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com concierge no WhatsApp"
      className="fixed bottom-6 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <MessageCircle size={20} />
    </a>
  );
}
