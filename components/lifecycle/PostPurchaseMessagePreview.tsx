import { Mail, MessageCircle, Smartphone } from "lucide-react";
import type { ComponentType } from "react";

import type { LifecycleChannel, LifecycleTemplate, PostPurchaseMessage } from "@/lib/lifecycle/postPurchase";

type PostPurchaseMessagePreviewProps = {
  item: LifecycleTemplate | PostPurchaseMessage;
  className?: string;
};

const channelIcon: Record<LifecycleChannel, ComponentType<{ className?: string }>> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
  push: Smartphone,
  in_app: MessageCircle
};

export function PostPurchaseMessagePreview({ item, className = "" }: PostPurchaseMessagePreviewProps) {
  const Icon = channelIcon[item.channel] ?? Mail;
  const title = "name" in item ? item.name : item.subject ?? item.templateId;

  return (
    <article className={`rounded-[8px] border border-black/10 bg-white p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">{item.channel}</p>
          <h3 className="mt-1 text-sm font-semibold text-[#211c18]">{title}</h3>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7eee9] text-[#8e5b68]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      {"subject" in item && item.subject ? (
        <p className="mt-4 text-sm font-semibold text-black/80">{item.subject}</p>
      ) : null}
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/64">{item.body}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8e5b68]">{item.ctaLabel}</p>
    </article>
  );
}
