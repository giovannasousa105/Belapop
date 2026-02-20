"use client";

import React from "react";

import { LuxuryButton } from "@/components/LuxuryButton";

type BannerPanelProps = {
  title: string;
  description: string;
  detail?: string;
  cta?: {
    label: string;
    href: string;
    variant?: "primary" | "secondary";
  };
  className?: string;
};

export const BannerPanel = ({
  title,
  description,
  detail,
  cta,
  className = ""
}: BannerPanelProps) => (
  <div
    className={`flex flex-col gap-4 rounded-[28px] border border-[#F6D6E2] bg-white p-6 shadow-sm ${className}`}
  >
    {detail && (
      <p className="text-[10px] uppercase tracking-[0.4em] text-bpGraphite/70">{detail}</p>
    )}
    <h3 className="font-display text-3xl text-bpBlack">{title}</h3>
    <p className="text-sm text-bpGraphite/80">{description}</p>
    {cta && (
      <div>
        <LuxuryButton variant={cta.variant ?? "secondary"} href={cta.href}>
          {cta.label}
        </LuxuryButton>
      </div>
    )}
  </div>
);
