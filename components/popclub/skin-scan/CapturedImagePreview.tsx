"use client";

/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";

type CapturedImagePreviewProps = {
  src: string;
  children?: ReactNode;
};

export default function CapturedImagePreview({ src, children }: CapturedImagePreviewProps) {
  return (
    <div className="fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden bg-black">
      <img src={src} alt="Captura do Skin Scan" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/22" />
      {children}
    </div>
  );
}
