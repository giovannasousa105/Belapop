import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidade",
  description:
    "Informações sobre coleta, uso, compartilhamento e proteção de dados na Plataforma BelaPop."
};

const UPDATED_AT = "05/02/2026";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 font-display text-2xl text-bpBlack">{children}</h2>
);

export default function PrivacidadePage() {
  return (
    <div className="bg-white text-bpBlack">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-bpGraphite/70">
          Institucional
        </p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">
          Aviso de Privacidade
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bpGraphite">
          Este Aviso consolida práticas de privacidade e proteção de dados da
          Plataforma BelaPop, em conformidade com a LGPD (Lei nº 13.709/2018).
        </p>

        <div className="mt-8 rounded-3xl border border-black/10 bg-bpOffWhite p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            Controladora
          </p>
          <p className="mt-2 text-sm text-bpGraphite">
            <span className="font-semibold text-bpBlackSoft">BelaPop</span> — CNPJ:
            63.945.608/0001-09
          </p>
          <p className="mt-1 text-sm text-bpGraphite">
            Canal de Atendimento:{" "}
            <span className="font-semibold text-bpBlackSoft">+55 34 9804-7036</span>
          </p>
          <p className="mt-1 text-xs text-bpGraphite/70">Atualizado em {UPDATED_AT}.</p>
        </div>

        <SectionTitle>Dados pessoais coletados</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <ul className="space-y-2 text-sm leading-relaxed text-bpGraphite">
            <li>
              Dados cadastrais: nome, e-mail, telefone e endereço, quando
              fornecidos.
            </li>
            <li>
              Dados de navegação: IP, cookies e identificadores técnicos (conforme
              configuração do navegador e do dispositivo).
            </li>
            <li>
              Dados de pagamento: processados por terceiros (a BelaPop não
              armazena dados completos de cartão).
            </li>
            <li>Dados de login social, quando você escolhe Google/Facebook.</li>
          </ul>
        </div>

        <SectionTitle>Finalidades do tratamento</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-bpOffWhite p-6">
          <ul className="space-y-2 text-sm leading-relaxed text-bpGraphite">
            <li>Gerenciamento de conta e autenticação.</li>
            <li>Processamento de pedidos, pagamento e logística.</li>
            <li>Comunicação operacional (status, suporte, avisos).</li>
            <li>Prevenção a fraudes e segurança.</li>
            <li>Cumprimento de obrigações legais e regulatórias.</li>
            <li>Marketing, quando houver consentimento do titular.</li>
          </ul>
        </div>

        <SectionTitle>Bases legais (LGPD)</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          O tratamento pode ocorrer com base em: execução de contrato, cumprimento
          de obrigação legal, consentimento do titular e legítimo interesse da
          BelaPop, quando aplicável.
        </p>

        <SectionTitle>Compartilhamento de dados</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Podemos compartilhar dados com: lojistas parceiros (para atendimento e
          cumprimento do pedido), gateways de pagamento, transportadoras,
          provedores de autenticação e autoridades quando exigido por lei.
        </p>

        <SectionTitle>Seguranca da informacao</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Aplicamos criptografia, controle de acesso e boas práticas de
          segurança para proteção dos dados.
        </p>

        <SectionTitle>Direitos do titular</SectionTitle>
        <div className="mt-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <ul className="space-y-2 text-sm leading-relaxed text-bpGraphite">
            <li>Acesso e confirmacao de tratamento.</li>
            <li>Correção e atualização.</li>
            <li>Exclusão e anonimização, quando aplicável.</li>
            <li>Portabilidade, nos termos da lei.</li>
            <li>Revogação de consentimento.</li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
            Para exercer seus direitos, entre em contato pelo Canal de
            Atendimento:{" "}
            <span className="font-semibold text-bpBlackSoft">+55 34 9804-7036</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
