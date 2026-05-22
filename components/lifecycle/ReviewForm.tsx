"use client";

import { useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";

import { ReviewStars } from "@/components/lifecycle/ReviewStars";
import type { ReviewRequest } from "@/lib/lifecycle/postPurchase";

type ReviewFormProps = {
  request: ReviewRequest;
};

export function ReviewForm({ request }: ReviewFormProps) {
  const [rating, setRating] = useState(request.rating ?? 0);
  const [feedback, setFeedback] = useState(request.feedback ?? "");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="rounded-[8px] border border-black/10 bg-white p-5 shadow-sm md:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/45">Avaliacao real</p>
      <h2 className="mt-2 font-editorial text-3xl leading-tight text-[#211c18]">{request.productName}</h2>
      <p className="mt-3 text-sm leading-relaxed text-black/65">
        Queremos saber como foi sua experiencia real com esse produto. Nao ha beneficio por avaliacao positiva: o que importa e contexto.
      </p>

      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Nota</span>
          <ReviewStars value={rating} onChange={setRating} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Comentario</span>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={5}
            placeholder="Conte como foi o uso, textura, sensacao na pele e se você continuaria na rotina."
            className="w-full resize-none rounded-[8px] border border-black/12 bg-[#fcfaf8] px-4 py-3 text-sm outline-none transition focus:border-[#8e5b68]"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[8px] border border-dashed border-black/18 bg-[#fcfaf8] px-4 py-4 text-sm text-black/62">
          <span className="flex items-center gap-3">
            <Camera className="h-4 w-4" aria-hidden="true" />
            Foto opcional do produto ou textura
          </span>
          <input type="file" accept="image/*" className="sr-only" />
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#211c18] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white sm:w-auto"
      >
        Avaliar produto
      </button>

      {submitted ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Avaliacao recebida. Obrigada por compartilhar sua experiencia com a BelaPop.
        </p>
      ) : null}
    </form>
  );
}
