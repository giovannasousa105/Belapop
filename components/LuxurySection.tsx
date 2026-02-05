"use client";

import React from "react";

type LuxurySectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export const LuxurySection = ({
  eyebrow,
  title,
  subtitle,
  children,
  className
}: LuxurySectionProps) => {
  return (
    <section className={`py-16 md:py-24 ${className ?? ""}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-luxe text-blush-100/70">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="editorial-line mt-2 font-display text-3xl font-semibold text-blush-50 md:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-4 text-sm text-blush-100/70 md:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
};
