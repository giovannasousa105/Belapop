import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Cookies",
  description:
    "Informacoes sobre o uso de cookies e preferencias de consentimento na BelaPop."
};

const UPDATED_AT = "18/02/2026";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 font-display text-2xl text-bpBlack">{children}</h2>
);

export default function CookiesPage() {
  return (
    <div className="bg-white text-bpBlack">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-bpGraphite/70">
          Institucional
        </p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">
          Politica de Cookies
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bpGraphite">
          Esta politica explica como usamos cookies para garantir o funcionamento
          do site, melhorar a experiencia e personalizar comunicacoes quando voce
          autoriza.
        </p>

        <div className="mt-8 rounded-3xl border border-black/10 bg-bpOffWhite p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            Atualizacao
          </p>
          <p className="mt-2 text-sm text-bpGraphite">
            Esta politica foi atualizada em {UPDATED_AT}.
          </p>
        </div>

        <SectionTitle>O que sao cookies</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Cookies sao pequenos arquivos armazenados no seu navegador. Eles nos
          ajudam a lembrar suas preferencias, manter sessao ativa e entender o uso
          do site de forma agregada.
        </p>

        <SectionTitle>Tipos de cookies</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <ul className="space-y-3 text-sm leading-relaxed text-bpGraphite">
            <li>
              <span className="font-semibold text-bpBlackSoft">Essenciais:</span>{" "}
              sempre ativos, garantem o funcionamento do site.
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">Analiticos:</span>{" "}
              ajudam a medir desempenho e melhorar navegacao.
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">Marketing:</span>{" "}
              permitem personalizar conteudos e comunicacoes.
            </li>
          </ul>
        </div>

        <SectionTitle>Como gerenciar preferencias</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Voce pode aceitar todos, recusar ou personalizar suas preferencias no
          banner de cookies. Tambem e possivel ajustar configuracoes no seu
          navegador.
        </p>

        <SectionTitle>Contato</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Dvidas sobre esta politica? Fale com nosso concierge:
          <span className="font-semibold text-bpBlackSoft"> +55 34 9804-7036</span>.
        </p>
      </div>
    </div>
  );
}
