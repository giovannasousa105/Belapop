"use client";

import { useState } from "react";

import type { LifecycleTemplate } from "@/lib/lifecycle/postPurchase";

type CRMTemplateEditorProps = {
  templates: LifecycleTemplate[];
  className?: string;
};

export function CRMTemplateEditor({ templates, className = "" }: CRMTemplateEditorProps) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];
  const [bodyDraft, setBodyDraft] = useState(selected?.body ?? "");

  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-5 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">Editor de template</p>
          <h3 className="mt-1 font-editorial text-2xl text-[#211c18]">Tom premium, humano e direto</h3>
        </div>
        <select
          value={selectedId}
          onChange={(event) => {
            const next = templates.find((template) => template.id === event.target.value);
            setSelectedId(event.target.value);
            setBodyDraft(next?.body ?? "");
          }}
          className="h-11 rounded-full border border-black/12 bg-[#fcfaf8] px-4 text-sm outline-none"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="mt-5 space-y-3">
          {selected.subject ? (
            <input
              value={selected.subject}
              readOnly
              className="h-11 w-full rounded-[8px] border border-black/10 bg-[#fcfaf8] px-4 text-sm text-black/70"
            />
          ) : null}
          <textarea
            value={bodyDraft}
            onChange={(event) => setBodyDraft(event.target.value)}
            rows={8}
            className="w-full resize-none rounded-[8px] border border-black/12 bg-[#fcfaf8] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#8e5b68]"
          />
          <p className="text-xs leading-relaxed text-black/55">
            Revise assunto, contexto e tom antes de publicar ou enviar qualquer comunicacao ao cliente.
          </p>
        </div>
      ) : null}
    </section>
  );
}
