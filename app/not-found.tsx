import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center space-y-8">

      {/* Visual */}
      <div className="space-y-2">
        <p className="text-[80px] font-serif leading-none text-neutral-200 select-none">404</p>
        <p className="text-xs tracking-[0.3em] text-neutral-400 uppercase">Página não encontrada</p>
      </div>

      {/* Mensagem */}
      <div className="max-w-xs space-y-2">
        <p className="font-serif text-xl text-neutral-800">
          Essa página sumiu da vitrine.
        </p>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Pode ter sido movida, renomeada ou simplesmente não existe mais.
          Não se preocupe — tem muito mais para descobrir.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="w-full py-3.5 bg-black text-white text-xs tracking-widest rounded-xl hover:bg-neutral-800 transition-colors"
        >
          VOLTAR PARA O INÍCIO
        </Link>
        <Link
          href="/catalogo"
          className="w-full py-3.5 border border-neutral-200 text-xs tracking-widest rounded-xl hover:border-black transition-colors"
        >
          VER CATÁLOGO
        </Link>
        <Link
          href="/skin-scan"
          className="w-full py-3.5 border border-neutral-200 text-xs tracking-widest rounded-xl hover:border-black transition-colors"
        >
          FAZER LEITURA DE PELE
        </Link>
      </div>

      {/* Sugestões rápidas */}
      <div className="space-y-3 w-full max-w-xs">
        <p className="text-[10px] tracking-widest text-neutral-400 uppercase">Páginas populares</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { label: "Skincare", href: "/skincare" },
            { label: "Kits", href: "/kits" },
            { label: "Universos", href: "/universos" },
            { label: "PopClub", href: "/popclub" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-100 text-xs text-neutral-600 rounded-full hover:border-black hover:text-black transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
