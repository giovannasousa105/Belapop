"use client";

import { LucideIcon } from "lucide-react";

type BenefitCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const BenefitCard = ({ title, description, icon }: BenefitCardProps) => {
  const Icon = icon;
  return (
    <div className="group rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-luxe-600">
        <Icon size={18} />
      </div>
      <h3 className="mt-4 font-display text-xl text-noir-950">{title}</h3>
      <p className="mt-2 text-sm text-noir-600">{description}</p>
      <div className="mt-4 h-px w-12 bg-belapop-rose opacity-40" />
    </div>
  );
};
