"use client";

import { ReactNode } from "react";

type ProductFrameProps = {
  children: ReactNode;
  className?: string;
};

export const ProductFrame = ({ children, className = "" }: ProductFrameProps) => (
  <div
    className={`rounded-3xl border border-bpPinkSoft/60 bg-white shadow-[0_15px_35px_rgba(15,15,16,0.08)] ${className}`}
  >
    <div className="rounded-[30px] bg-white p-0">{children}</div>
  </div>
);
