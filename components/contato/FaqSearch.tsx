"use client";

import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

type FaqItem = { question: string; answer: string };
type FaqSection = { title: string; items: FaqItem[] };

export function FaqSearch({ sections }: { sections: FaqSection[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = q
    ? sections
        .map((s) => ({
          ...s,
          items: s.items.filter(
            (i) =>
              i.question.toLowerCase().includes(q) ||
              i.answer.toLowerCase().includes(q)
          )
        }))
        .filter((s) => s.items.length > 0)
    : sections;

  return (
    <div>
      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C88FA3]" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no FAQ…"
          className="h-12 w-full rounded-full border border-[#DDD3CA] bg-white pl-11 pr-10 text-sm text-[#1B1A18] placeholder:text-[#5F5A55]/50 focus:border-[#C88FA3] focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5A55]/60 hover:text-[#1B1A18]"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-[#5F5A55]">
          Nenhuma resposta encontrada para &ldquo;{query}&rdquo;. Tente outro termo ou{" "}
          <a href="mailto:contato@belapopoficial.com.br" className="underline underline-offset-4">
            fale com a gente
          </a>
          .
        </p>
      ) : (
        <div className="space-y-10">
          {filtered.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#C88FA3]">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-[20px] border border-[#E3CBD3] bg-white/70 px-5 py-4 open:pb-5"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                      <span className="text-sm font-semibold text-[#1B1A18]">{item.question}</span>
                      <ChevronDown
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#C88FA3] transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-[#5F5A55]">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
