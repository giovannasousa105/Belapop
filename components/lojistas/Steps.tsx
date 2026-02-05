"use client";

import { LucideIcon } from "lucide-react";

type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type StepsProps = {
  steps: Step[];
};

export const Steps = ({ steps }: StepsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div
            key={step.title}
            className="flex h-full flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-luxe-600">
                <Icon size={18} />
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-noir-400">
                Passo {index + 1}
              </span>
            </div>
            <h3 className="font-display text-lg text-noir-950">
              {step.title}
            </h3>
            <p className="text-sm text-noir-600">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
};
