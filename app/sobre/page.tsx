import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre a BelaPop",
  description:
    "Curadoria editorial, marketplace e atendimento concierge para beleza e autocuidado."
};

const UPDATED_AT = "05/02/2026";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 font-display text-2xl text-noir-950">{children}</h2>
);

export default function SobrePage() {
  return (
    <div className="bg-white text-noir-950">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-noir-500">
          Institucional
        </p>
        <h1 className="mt-3 font-display text-4xl text-noir-950">
          Sobre a BelaPop
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-noir-700">
          A BelaPop é um mini-marketplace editorial de beleza, autocuidado,
          cosméticos e acessórios. Curadoria humana, comunicação clara e uma
          experiência de compra pensada para rituais que fluem.
        </p>

        <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="grid gap-3 text-sm text-noir-700 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-noir-500">
                Controladora
              </p>
              <p className="mt-2 font-semibold text-noir-900">BelaPop</p>
              <p className="text-noir-600">CNPJ: 63.945.608/0001-09</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-noir-500">
                Atendimento
              </p>
              <p className="mt-2 text-noir-700">
                WhatsApp/Telefone:{" "}
                <span className="font-semibold text-noir-900">
                  +55 34 9804-7036
                </span>
              </p>
              <p className="text-xs text-noir-500">Atualizado em {UPDATED_AT}.</p>
            </div>
          </div>
        </div>

        <SectionTitle>O que você encontra aqui</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-noir-50 p-6">
          <ul className="space-y-2 text-sm leading-relaxed text-noir-700">
            <li>
              Explore e adquira produtos selecionados de beleza, autocuidado,
              cosméticos e acessórios.
            </li>
            <li>
              Acompanhe o status dos seus pedidos, da confirmação à entrega.
            </li>
            <li>
              Gerencie dados de conta, endereços e preferências de comunicação.
            </li>
            <li>
              Solicite trocas, devoluções e reembolsos, conforme os termos
              aplicáveis.
            </li>
            <li>
              Acesse nosso atendimento para suporte, dúvidas e solicitações.
            </li>
          </ul>
        </div>

        <SectionTitle>Uso pessoal</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-noir-700">
          A Plataforma e os produtos adquiridos destinam-se ao uso pessoal. Por
          isso, você não deve utilizar a Plataforma ou adquirir produtos com
          finalidade de revenda ou qualquer caráter comercial.
        </p>
      </div>
    </div>
  );
}
