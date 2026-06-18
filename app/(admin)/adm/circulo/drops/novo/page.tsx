"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoDropPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [notes, setNotes] = useState("");
  const [glassQty, setGlassQty] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Título é obrigatório."); return; }
    if (!opensAt || !closesAt) { setError("Datas de abertura e fechamento são obrigatórias."); return; }
    if (new Date(closesAt) <= new Date(opensAt)) { setError("Fechamento deve ser após a abertura."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/adm/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle:    subtitle.trim()    || undefined,
          description: description.trim() || undefined,
          opens_at:    new Date(opensAt).toISOString(),
          closes_at:   new Date(closesAt).toISOString(),
          notes:       notes || undefined,
          glass_qty:   glassQty,
        }),
      });
      const data = (await res.json()) as { drop?: { id: string }; error?: string };
      if (!res.ok) { setError(data.error ?? "Erro ao criar drop."); return; }
      router.push(`/adm/circulo/drops/${data.drop?.id ?? ""}`);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "block w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/10";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Novo Drop</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Crie um rascunho. Adicione SKUs e publique quando estiver pronto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label className={labelClass}>Título do drop</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Drops Coreanos de Inverno — Vol. 3"
            maxLength={120}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Subtítulo (opcional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
            className={inputClass}
            placeholder="Linha de apoio exibida na PDP"
          />
        </div>

        <div>
          <label className={labelClass}>Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={3000}
            className={`${inputClass} resize-none`}
            placeholder="Markdown suportado na PDP."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Abertura da pré-venda</label>
            <input
              type="datetime-local"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Fechamento da pré-venda</label>
            <input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Drop Glass (quantidade)</label>
          <input
            type="number"
            value={glassQty}
            onChange={(e) => setGlassQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
            min={0}
            step={1}
            className={inputClass}
            placeholder="0"
          />
        </div>

        <div>
          <label className={labelClass}>Notas internas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto, fornecedores, observações..."
            rows={3}
            maxLength={1000}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-black py-3 text-xs font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "Criando..." : "Criar rascunho"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-neutral-200 px-5 py-3 text-xs tracking-wider transition-colors hover:border-neutral-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
