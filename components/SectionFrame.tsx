"use client";

import { ReactNode } from "react";

type SectionFrameProps = {
  children: ReactNode;
  className?: string;
};

export const SectionFrame = ({ children, className = "" }: SectionFrameProps) => (
  <div className={`mx-auto w-full max-w-6xl ${className}`}>
    <div className="rounded-3xl border border-[#F6D6E2] bg-white px-6 py-8 shadow-sm">
      {children}
    </div>
  </div>
);
