import Link from "next/link";

import { getPreviewScreen, previewScreens, type PreviewScreenSlug } from "./data";

export function PreviewShell({
  current,
  children
}: {
  current: PreviewScreenSlug;
  children: React.ReactNode;
}) {
  const currentScreen = getPreviewScreen(current);

  return (
    <div className="min-h-screen bg-[#f7f4f3] text-[#1c1b1b]">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/preview" className="font-display text-2xl tracking-[-0.03em]">
              BelaPop
            </Link>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-black/45">
              Preview estrutural
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.24em] text-black/45">Tela</p>
            <p className="text-sm font-medium">{currentScreen?.title}</p>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {previewScreens.map((screen) => (
              <Link
                key={screen.slug}
                href={`/preview/${screen.slug}`}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.24em] ${
                  screen.slug === current
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-[#f7f4f3] text-black/60"
                }`}
              >
                {screen.title}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ScreenPlaceholder({
  title,
  description,
  finalPath
}: {
  title: string;
  description: string;
  finalPath: string;
}) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[28px] border border-black/8 bg-white p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Estrutura preservada</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.03em] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-black/65">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-black/10 bg-[#f7f4f3] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-black/55">
              Rota final {finalPath}
            </span>
            <span className="rounded-full border border-black/10 bg-[#f7f4f3] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-black/55">
              Design removido para nova entrada
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-[28px] border border-dashed border-black/12 bg-white p-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-black/45">Bloco 01</p>
            <h2 className="mt-3 font-display text-3xl">Header / Hero</h2>
            <p className="mt-3 text-sm leading-7 text-black/65">
              Reservado para o novo codigo visual da tela, sem alterar a estrutura da rota.
            </p>
          </div>

          <div className="rounded-[28px] border border-dashed border-black/12 bg-white p-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-black/45">Bloco 02</p>
            <h2 className="mt-3 font-display text-3xl">Conteudo principal</h2>
            <p className="mt-3 text-sm leading-7 text-black/65">
              Aqui entra o novo layout quando voce reenviar o HTML de design.
            </p>
          </div>

          <div className="rounded-[28px] border border-dashed border-black/12 bg-white p-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-black/45">Bloco 03</p>
            <h2 className="mt-3 font-display text-3xl">CTA / apoio</h2>
            <p className="mt-3 text-sm leading-7 text-black/65">
              Espaco reservado para navegacao, resumo, CTA fixo ou suporte da tela.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
