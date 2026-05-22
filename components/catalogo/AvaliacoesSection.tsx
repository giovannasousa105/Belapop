"use client";

import { useState } from "react";
import useSWR       from "swr";

import type { AvaliacaoDTO } from "@/lib/catalogo/catalogoTypes";

interface AvaliacoesResponse {
  itens: AvaliacaoDTO[];
  total: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<AvaliacoesResponse>);

interface Props { product_id: string }

function Estrelas({ nota }: { nota: number }) {
  return (
    <span aria-label={`${nota} de 5 estrelas`} className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" fill={n <= nota ? "#f59e0b" : "#e5e7eb"} className="w-3.5 h-3.5" aria-hidden>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

export function AvaliacoesSection({ product_id }: Props) {
  const [formAberto, setFormAberto] = useState(false);
  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const { data, isLoading } = useSWR<AvaliacoesResponse>(
    `/api/catalogo/avaliacoes?product_id=${product_id}`,
    fetcher,
  );

  const itens = data?.itens ?? [];
  const total = data?.total ?? 0;

  async function enviar() {
    if (!nota) return;
    setEnviando(true);
    await fetch("/api/catalogo/avaliações", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id, nota, texto }),
    });
    setEnviando(false);
    setEnviado(true);
    setFormAberto(false);
  }

  return (
    <section aria-label="Avaliações" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Avaliações ({total})</h2>
        {!enviado && !formAberto && (
          <button
            type="button"
            onClick={() => setFormAberto(true)}
            className="text-sm text-rose-600 hover:underline"
          >
            Avaliar produto
          </button>
        )}
      </div>

      {formAberto && (
        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="flex gap-1">
            {[1,2,3,4,5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n)}
                aria-label={`${n} estrelas`}
                className={`text-2xl transition-colors ${n <= nota ? "text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Compartilhe sua experiência (opcional)"
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-rose-200"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={!nota || enviando}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {enviando ? "Enviando…" : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="px-4 py-2 rounded-xl text-slate-500 text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {enviado && (
        <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2">
          Avaliação enviada! Será publicada após moderação.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Ainda sem avaliações. Seja o primeiro!</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-100 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Estrelas nota={a.nota} />
                {a.tipo_pele && (
                  <span className="text-xs text-slate-400">· pele {a.tipo_pele.toLowerCase()}</span>
                )}
              </div>
              {a.titulo && <p className="text-sm font-medium text-slate-800">{a.titulo}</p>}
              {a.texto  && <p className="text-sm text-slate-600">{a.texto}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
