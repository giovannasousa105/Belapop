"use client";

import { Check, Circle, X } from "lucide-react";

import type { CaptureCheckStatus } from "@/lib/skincare/faceCaptureReadiness";

type ScanStatusIndicatorsProps = {
  face: CaptureCheckStatus;
  distance: CaptureCheckStatus;
  lighting: CaptureCheckStatus;
  stability: CaptureCheckStatus;
};

const indicatorTone: Record<CaptureCheckStatus, string> = {
  pending: "border-white/14 bg-white/[0.05] text-white/62",
  error: "border-[#f0b66d]/35 bg-[#f0b66d]/12 text-[#ffd9a8]",
  ok: "border-[#8ee6bd]/38 bg-[#8ee6bd]/12 text-[#caffdf]"
};

const indicatorIcons = {
  pending: Circle,
  error: X,
  ok: Check
} satisfies Record<CaptureCheckStatus, typeof Circle>;

function Indicator({ label, status }: { label: string; status: CaptureCheckStatus }) {
  const Icon = indicatorIcons[status];

  return (
    <div
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 text-[9px] uppercase tracking-[0.18em] ${indicatorTone[status]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default function ScanStatusIndicators({
  face,
  distance,
  lighting,
  stability
}: ScanStatusIndicatorsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
      <Indicator label="Rosto" status={face} />
      <Indicator label="Distancia" status={distance} />
      <Indicator label="Luz" status={lighting} />
      <Indicator label="Estavel" status={stability} />
    </div>
  );
}
