import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Segurança",
  description:
    "Práticas de segurança aplicadas para proteger dados, conta e operação da BelaPop."
};

const UPDATED_AT = "05/02/2026";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 font-display text-2xl text-noir-950">{children}</h2>
);

export default function SegurancaPage() {
  return (
    <div className="bg-white text-noir-950">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-noir-500">
          Institucional
        </p>
        <h1 className="mt-3 font-display text-4xl text-noir-950">Segurança</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-noir-700">
          Segurança é parte da experiência. Usamos boas práticas para proteger
          dados pessoais, acessos e operação do marketplace, com foco em
          minimização, controle e rastreabilidade.
        </p>

        <div className="mt-8 rounded-3xl border border-black/10 bg-noir-50 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
            Canal de atendimento
          </p>
          <p className="mt-2 text-sm text-noir-700">
            WhatsApp/Telefone:{" "}
            <span className="font-semibold text-noir-900">+55 34 9804-7036</span>
          </p>
          <p className="mt-1 text-xs text-noir-500">Atualizado em {UPDATED_AT}.</p>
        </div>

        <SectionTitle>Proteção de dados</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <ul className="space-y-2 text-sm leading-relaxed text-noir-700">
            <li>Criptografia e canais seguros para transmissão de dados.</li>
            <li>
              Controles de acesso, permissão por função e segregação de
              responsabilidades.
            </li>
            <li>
              Boas práticas de desenvolvimento para reduzir riscos e falhas.
            </li>
          </ul>
        </div>

        <SectionTitle>Pagamentos</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-noir-700">
          Dados de pagamento são processados por provedores terceiros. A BelaPop
          não armazena dados sensíveis completos de cartão. Quando aplicável,
          utilizamos tokenização e integrações alinhadas a padrões de mercado
          (por exemplo, PCI via provedor).
        </p>

        <SectionTitle>Prevenção a fraudes</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-noir-700">
          Podemos realizar verificações adicionais e aplicar mecanismos de
          prevenção a fraude para proteger o usuário, os lojistas e a
          Plataforma.
        </p>

        <SectionTitle>Boas práticas para você</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-noir-50 p-6">
          <ul className="space-y-2 text-sm leading-relaxed text-noir-700">
            <li>Use senhas fortes e não compartilhe credenciais.</li>
            <li>Mantenha navegador e dispositivo atualizados.</li>
            <li>
              Ao notar uso não autorizado, fale conosco imediatamente pelo canal
              acima.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
