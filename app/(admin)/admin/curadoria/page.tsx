import Link from "next/link";

import DiscoveryCurationManager from "@/components/admin/DiscoveryCurationManager";
import { fetchDiscoveryCurationAdminData } from "@/lib/admin/discoveryCuration";

export const dynamic = "force-dynamic";

export default async function AdminCuradoriaPage() {
  const data = await fetchDiscoveryCurationAdminData();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Curadoria BelaPop</p>
          <h1 className="font-display text-4xl text-bpBlack">Colecoes editoriais e discovery</h1>
          <p className="max-w-3xl text-sm text-bpGraphite/80">
            Ordene as colecoes da home e os produtos de cada colecao direto no schema novo.
            Isso controla Curadoria BelaPop, Tendencias Globais e as vitrines discovery sem deploy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalogo?sort=featured"
            className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-bpGraphite transition hover:border-bpPink/40 hover:text-bpBlack"
          >
            Ver catalogo featured
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-bpGraphite transition hover:border-bpPink/40 hover:text-bpBlack"
          >
            Ver home publica
          </Link>
        </div>
      </header>

      <DiscoveryCurationManager
        kinds={data.kinds}
        collections={data.collections}
        availableProducts={data.availableProducts}
      />
    </div>
  );
}
