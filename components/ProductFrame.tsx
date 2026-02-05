"use client";

import { ReactNode } from "react";

type ProductFrameProps = {
  children: ReactNode;
  className?: string;
};

export const ProductFrame = ({ children, className = "" }: ProductFrameProps) => (
  <div
    className={`rounded-3xl border border-[#F6D6E2] bg-white shadow-[0_15px_35px_rgba(7,7,10,0.08)] ${className}`}
  >
    <div className="rounded-[30px] bg-white p-0">{children}</div>
  </div>
);
