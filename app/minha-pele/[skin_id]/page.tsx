import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TwinSnapshotRow } from "@/lib/digitalTwin/twinTypes";

interface Props {
  params: Promise<{ skin_id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skin_id } = await params;
  return {
    title: `Análise de Pele ${skin_id} — BelaPop`,
    description: "Resultado de análise de pele BelaPop Skin Scan.",
  };
}

const TIPO_LABEL: Record<string, string> = {
  OLEOSA: "Oleosa",
  SECA: "Seca",
  MISTA: "Mista",
  SENSIVEL: "Sensível",
  NORMAL: "Normal",
};

const MARKER_LABELS: Record<string, string> = {
  acne: "Acne",
  poros: "Poros",
  textura: "Textura",
  oleosidade: "Oleosidade",
  pigmentacao: "Pigmentação",
  vermelhidao: "Vermelhidão",
  ressecamento: "Ressecamento",
};

export default async function SkinIdPage({ params }: Props) {
  const { skin_id } = await params;
  const admin = getSupabaseAdminClient();

  // Buscar o scan pelo skin_id público (BP-XXXXXX)
  const { data: scan } = await admin
    .from("skin_scans")
    .select("id, skin_id, focos_selecionados, criado_em")
    .eq("skin_id", skin_id.toUpperCase())
    .eq("status", "CONCLUIDO")
    .maybeSingle();

  if (!scan) notFound();

  const { data: profile } = await admin
    .from("scan_skin_profiles")
    .select("tipo_pele, nivel_sensibilidade, scores_normalizados, ativos_recomendados")
    .eq("scan_id", scan.id)
    .maybeSingle();

  if (!profile) notFound();

  const scores = profile.scores_normalizados as Record<string, number>;
  const data = new Date(scan.criado_em as string).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
        Skin Scan · BelaPop
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-stone-900">
        Análise de Pele
      </h1>
      <p className="mt-0.5 text-sm text-stone-500">
        {data} · ID: {skin_id}
      </p>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
            Pele {TIPO_LABEL[profile.tipo_pele as string] ?? profile.tipo_pele}
          </span>
          <span className="text-xs text-stone-500">
            Sensibilidade {profile.nivel_sensibilidade}/5
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {Object.entries(scores)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([marker, score]) => (
              <div key={marker} className="flex items-center gap-3">
                <span className="w-28 text-sm text-stone-600">
                  {MARKER_LABELS[marker] ?? marker}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-violet-400"
                    style={{ width: `${Math.round(score as number)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-stone-500">
                  {Math.round(score as number)}
                </span>
              </div>
            ))}
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Score menor = condição melhor controlada.
        </p>
      </div>

      {Array.isArray(profile.ativos_recomendados) && (profile.ativos_recomendados as string[]).length > 0 && (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-stone-900">Ativos recomendados</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(profile.ativos_recomendados as string[]).slice(0, 6).map((a) => (
              <span
                key={a}
                className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs text-emerald-700"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-stone-400">
        Esta análise é educacional e não substitui avaliação dermatológica.
      </p>
    </main>
  );
}
