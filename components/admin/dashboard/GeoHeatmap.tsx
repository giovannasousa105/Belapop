"use client";

// Placeholder heatmap card; real map pode usar Leaflet/topojson futuramente.
// Recebe valores por UF e lista em grade simples.

type UFStat = { uf: string; value: number };

type Props = {
  data: UFStat[];
};

export function GeoHeatmap({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="text-xs uppercase tracking-[0.25em] text-noir-500">
        Vendas por UF
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
        {sorted.map((item) => (
          <div
            key={item.uf}
            className="rounded-xl border border-black/5 bg-noir-50 px-3 py-2 flex items-center justify-between"
          >
            <span className="font-semibold text-noir-800">{item.uf}</span>
            <span className="text-noir-600">{item.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-noir-500">
        Mapa detalhado (Leaflet/topojson) pode substituir esta visão quando a
        dependência estiver disponível.
      </p>
    </div>
  );
}
