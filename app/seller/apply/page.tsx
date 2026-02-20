import Link from "next/link";

export default function SellerApplyPage() {
  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
            Aplicacao de lojista
          </p>
          <h1 className="mt-2 font-display text-3xl text-bpBlack">
            Seja parceiro BelaPop
          </h1>
          <p className="mt-3 text-sm text-bpGraphite/80">
            Cadastre sua marca para iniciar a curadoria e receber orientacoes de
            vitrine, logistica e performance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/seller/register"
              className="rounded-full bg-bpPink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-bpSoft"
            >
              Criar conta de lojista
            </Link>
            <Link
              href="/seller/partner"
              className="rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-bpGraphite"
            >
              Ver como funciona
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
