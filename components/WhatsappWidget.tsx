"use client";

import { MessageCircle } from "lucide-react";

type WhatsappWidgetProps = {
  phone?: string;
};

const DEFAULT_PHONE = "+5511912345678"; // troque para o número oficial
const DEFAULT_TEXT = "Ol%C3%A1%2C%20quero%20falar%20com%20o%20concierge%20BelaPop";

export function WhatsappWidget({ phone }: WhatsappWidgetProps) {
  const targetPhone =
    phone ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    DEFAULT_PHONE;

  const href = `https://wa.me/${targetPhone.replace(/\D/g, "")}?text=${DEFAULT_TEXT}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com concierge no WhatsApp"
      className="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bottom-6"
    >
      <MessageCircle size={18} />
      <span className="hidden md:inline">Concierge WhatsApp</span>
      <span className="md:hidden">WhatsApp</span>
    </a>
  );
}
