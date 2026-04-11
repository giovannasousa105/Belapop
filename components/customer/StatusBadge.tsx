"use client";

import { Info } from "lucide-react";

import type { UiStatus } from "@/lib/customer/portal";

type StatusBadgeProps = {
  status: UiStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const Icon = status.icon ?? Info;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-3 py-1.5 text-[12px] font-medium text-bpGraphite/90 ${className}`}
    >
      <Icon size={14} className="text-bpGraphite/70" />
      <span>{status.label}</span>
    </span>
  );
}
