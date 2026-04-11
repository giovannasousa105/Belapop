import Link from "next/link";

import SkinGptEvidenceManager from "@/components/admin/SkinGptEvidenceManager";
import { fetchSkinGptEvidenceAdminData } from "@/lib/admin/skinGptEvidence";

export const dynamic = "force-dynamic";

export default async function AdminSkinBelaEvidencePage() {
  const data = await fetchSkinGptEvidenceAdminData();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">SkinBela</p>
          <h1 className="font-display text-4xl text-bpBlack">Curadoria de evidencia clinica</h1>
          <p className="max-w-3xl text-sm text-bpGraphite/80">
            Publique, arquive e priorize documentos clinicos da SkinBela sem deploy. O motor
            so usa evidencias publicadas e a curadoria editorial entra como desempate, nao
            como atalho para atropelar a hierarquia de evidencia.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/conta/skincare"
            className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-bpGraphite transition hover:border-bpPink/40 hover:text-bpBlack"
          >
            Ver experiencia do cliente
          </Link>
          <Link
            href="/admin/curadoria"
            className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-bpGraphite transition hover:border-bpPink/40 hover:text-bpBlack"
          >
            Voltar para discovery
          </Link>
        </div>
      </header>

      <SkinGptEvidenceManager documents={data.documents} options={data.options} />
    </div>
  );
}
