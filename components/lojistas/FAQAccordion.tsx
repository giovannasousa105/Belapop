"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

export const FAQAccordion = ({ items }: FAQAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-black/10 rounded-2xl border border-black/10 bg-white shadow-sm">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className="px-6 py-5">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
            >
              <span className="font-display text-lg text-noir-950">
                {item.question}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/10 transition ${
                  isOpen ? "bg-belapop-rose text-white" : "text-noir-600"
                }`}
              >
                <ChevronDown
                  size={16}
                  className={isOpen ? "rotate-180 transition" : "transition"}
                />
              </span>
            </button>
            <div
              id={`faq-panel-${index}`}
              className={`grid transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="mt-3 text-sm text-noir-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
