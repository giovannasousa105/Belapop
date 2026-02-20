import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos e Condições Gerais",
  description:
    "Termos e condições de uso da Plataforma BelaPop, incluindo política de trocas, devoluções e regras de marketplace."
};

const UPDATED_AT = "05/02/2026";

const Anchor = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <a
    href={`#${id}`}
    className="text-sm font-semibold text-bpBlackSoft hover:text-bpPink"
  >
    {children}
  </a>
);

const SectionTitle = ({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) => (
  <h2
    id={id}
    className="scroll-mt-32 mt-12 font-display text-2xl text-bpBlack"
  >
    {children}
  </h2>
);

export default function TermosPage() {
  return (
    <div className="bg-white text-bpBlack">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-bpGraphite/70">
          Institucional
        </p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">
          Termos e Condições Gerais
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bpGraphite">
          Estes Termos regulam o uso da Plataforma BelaPop e a experiência de
          compra no marketplace. Ao utilizar a Plataforma, você concorda com
          estas condições e com a legislação aplicável.
        </p>

        <div className="mt-8 rounded-3xl border border-black/10 bg-bpOffWhite p-6">
          <div className="grid gap-3 text-sm text-bpGraphite md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
                Operadora
              </p>
              <p className="mt-2 font-semibold text-bpBlackSoft">BelaPop</p>
              <p className="text-bpGraphite/80">CNPJ: 63.945.608/0001-09</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
                Atendimento
              </p>
              <p className="mt-2 text-bpGraphite">
                WhatsApp/Telefone:{" "}
                <span className="font-semibold text-bpBlackSoft">
                  +55 34 9804-7036
                </span>
              </p>
              <p className="text-xs text-bpGraphite/70">Atualizado em {UPDATED_AT}.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-bpGraphite/70">
            Sumário
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Anchor id="sobre-a-plataforma">1. Sobre a Plataforma</Anchor>
            <Anchor id="cadastro-e-login">2. Cadastro e login</Anchor>
            <Anchor id="como-funciona">3.1. Como a Plataforma funciona</Anchor>
            <Anchor id="pagamentos">3.2. Pagamentos e segurança</Anchor>
            <Anchor id="precos">3.3. Preços e promoções</Anchor>
            <Anchor id="entrega">3.4. Rastreamento e entrega</Anchor>
            <Anchor id="trocas">3.5. Trocas, devoluções e reembolsos</Anchor>
            <Anchor id="direitos-bela-pop">
              4. Direitos da BelaPop sobre a Plataforma
            </Anchor>
            <Anchor id="responsabilidades">
              5. Responsabilidades do Usuário e da BelaPop
            </Anchor>
            <Anchor id="disposicoes">6. Disposições gerais</Anchor>
            <Anchor id="marketplace">7. Modelo de marketplace</Anchor>
            <Anchor id="termos-lojista">Termos do Lojista</Anchor>
          </div>
        </div>

        <SectionTitle id="sobre-a-plataforma">1. Sobre a Plataforma</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A Plataforma é operada pela BelaPop, pessoa jurídica inscrita no CNPJ
          nº 63.945.608/0001-09 ("BelaPop"). O Canal de Atendimento
          (WhatsApp/Telefone) é +55 34 9804-7036.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A Plataforma permite que você: explore e adquira produtos; acompanhe o
          status do pedido, da confirmação à entrega; gerencie seus dados e
          preferências; solicite trocas, devoluções e reembolsos; e acesse nosso
          atendimento para suporte e solicitações.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A Plataforma e os produtos adquiridos destinam-se ao uso pessoal. Não é
          permitido utilizar a Plataforma ou adquirir produtos com finalidade de
          revenda ou caráter comercial.
        </p>

        <SectionTitle id="cadastro-e-login">2. Cadastro e login</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Para acessar determinadas funcionalidades, você deve realizar cadastro
          prévio, fornecendo informações verdadeiras, completas e atualizadas. O
          acesso à área restrita é feito por login e senha ou, quando disponível,
          por autenticação via serviços de terceiros autorizados (social login).
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          O cadastro é permitido apenas para maiores de 18 anos. Ao se cadastrar,
          você declara ser maior de idade e estar legalmente apto a utilizar os
          Serviços.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Caso sejam identificadas informações falsas, uso indevido, fraude,
          descumprimento destes Termos ou da legislação aplicável, a BelaPop pode
          cancelar o cadastro, bloquear o acesso e/ou cancelar pedidos, conforme
          o caso.
        </p>

        <SectionTitle id="como-funciona">3.1. Como a Plataforma funciona</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Para comprar, você precisa ter cadastro ativo e fornecer as informações
          solicitadas. Um pedido é concluído e processado após: seleção dos
          produtos e inclusão no carrinho; confirmação de disponibilidade
          (estoque); definição de frete e escolha de entrega conforme endereço; e
          confirmação do pagamento pelos meios disponíveis.
        </p>

        <SectionTitle id="pagamentos">3.2. Formas de pagamento e segurança</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          As formas de pagamento podem incluir, conforme disponibilidade no
          checkout: cartões de crédito, Pix e boleto. Titulares de cartões estão
          sujeitos a validação e autorização da administradora do cartão.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A Plataforma adota medidas de segurança, como criptografia e protocolos
          de proteção de dados compatíveis com o mercado. A BelaPop pode realizar
          verificações adicionais para confirmação de identidade e prevenção a
          fraudes.
        </p>

        <SectionTitle id="precos">3.3. Preços e promoções</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Os preços exibidos são válidos para compras realizadas na Plataforma e
          podem variar em relação a outros canais e campanhas. Preços e
          promoções aplicáveis são aqueles vigentes no momento da conclusão do
          pedido. O valor do frete é informado antes da confirmação final.
        </p>

        <SectionTitle id="entrega">3.4. Rastreamento e entrega</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Você pode acompanhar o status do pedido. Informações de rastreio podem
          depender de parceiros logísticos e estar sujeitas a indisponibilidades
          temporárias. O prazo de entrega conta a partir da aprovação do
          pagamento.
        </p>

        <SectionTitle id="trocas">3.5. Cancelamentos, devoluções e reembolsos</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A BelaPop respeita o Código de Defesa do Consumidor. Nos termos do art.
          49 do CDC, você pode exercer o direito de arrependimento em até 7
          (sete) dias corridos contados do recebimento do produto.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Para solicitar devolução, troca ou reembolso, siga as instruções
          apresentadas na Plataforma ou fale com o atendimento pelo +55 34
          9804-7036. Para que a devolução seja aceita, os itens devem estar nas
          mesmas condições do recebimento, sem indícios de uso, com embalagem e
          itens enviados (por exemplo, brindes e amostras), quando aplicável.
        </p>

        <SectionTitle id="direitos-bela-pop">
          4. Direitos da BelaPop sobre a Plataforma
        </SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A BelaPop concede a você uma licença pessoal, limitada, temporária, não
          exclusiva e intransferível para uso da Plataforma conforme estes
          Termos. Todos os direitos de propriedade intelectual relacionados a
          Plataforma e seus conteúdos pertencem a BelaPop e/ou licenciantes.
        </p>

        <SectionTitle id="responsabilidades">
          5. Responsabilidades do Usuário e da BelaPop
        </SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Você se compromete a usar a Plataforma com boa-fé, para fins lícitos e
          conforme estes Termos. É responsabilidade do Usuário manter seus
          dispositivos protegidos, utilizar navegadores atualizados e proteger
          login e senha. A BelaPop pode utilizar serviços de terceiros (hospedagem,
          pagamentos, logística) e buscar minimizar impactos quando houver
          falhas.
        </p>

        <SectionTitle id="disposicoes">6. Disposições gerais</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Estes Termos podem ser alterados a qualquer tempo. Quando houver
          mudanças relevantes, você será informado. A continuidade de uso após a
          alteração indica concordância com os novos Termos. Estes Termos são
          regidos pelas leis da República Federativa do Brasil.
        </p>

        <SectionTitle id="marketplace">7. Modelo de marketplace</SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A BelaPop atua como plataforma de marketplace, conectando Usuários a
          Lojistas parceiros independentes, responsáveis pela oferta e
          comercialização de seus produtos. A BelaPop não é fabricante dos
          produtos vendidos pelos Lojistas, salvo quando expressamente indicado.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          A BelaPop realiza curadoria prévia de Lojistas e produtos para manter
          padrão de qualidade e experiência. A curadoria não substitui nem exclui
          a responsabilidade do Lojista quanto à qualidade, conformidade legal,
          entrega e atendimento.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Um mesmo pedido pode conter produtos de mais de um Lojista. Nesses
          casos, os produtos podem ser enviados separadamente, em prazos
          distintos, com frete calculado por Lojista e múltiplos códigos de
          rastreamento.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Nos pedidos via marketplace, o Lojista responsável pelo produto é o
          responsável direto pela análise e execução de troca, devolução ou
          reembolso. A BelaPop pode atuar como facilitadora da comunicação para
          uma solução eficiente.
        </p>

        <SectionTitle id="termos-lojista">
          Termos e condições do Lojista BelaPop
        </SectionTitle>
        <p className="mt-4 text-sm leading-relaxed text-bpGraphite">
          Atualizado em 01/07/2025. Estes Termos regulam a relação entre a
          BelaPop e os Lojistas parceiros que utilizam a Plataforma para ofertar
          produtos aos consumidores finais.
        </p>
        <div className="mt-6 rounded-3xl border border-black/10 bg-bpOffWhite p-6">
          <ol className="space-y-4 text-sm leading-relaxed text-bpGraphite">
            <li>
              <span className="font-semibold text-bpBlackSoft">
                1. Quem pode ser lojista
              </span>
              <div className="mt-1">
                Podem se cadastrar pessoas jurídicas ou pessoas físicas
                legalmente habilitadas. A BelaPop realiza curadoria e análise
                prévia, podendo aprovar, reprovar ou solicitar ajustes antes da
                liberação da loja.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">2. Papel da BelaPop</span>
              <div className="mt-1">
                A BelaPop intermedia a conexão entre Lojistas e consumidores. Não
                assume responsabilidade por estoque, produção, qualidade, envio
                ou entrega dos produtos dos Lojistas.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                3. Responsabilidades do lojista
              </span>
              <div className="mt-1">
                O Lojista é integralmente responsável por qualidade,
                conformidade, veracidade das informações, emissão fiscal quando
                exigida, separação e despacho, prazos e atendimento a trocas e
                devoluções.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                4. Curadoria e padrão BelaPop
              </span>
              <div className="mt-1">
                A BelaPop pode solicitar ajustes, reprovar produtos, suspender
                temporariamente produtos ou lojas e encerrar parceria em caso de
                descumprimento. A curadoria não implica corresponsabilidade.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                5. Pedidos, frete e multi-envio
              </span>
              <div className="mt-1">
                Um pedido pode conter produtos de múltiplos Lojistas. O frete
                pode ser calculado individualmente por Lojista e somado no
                checkout. Os produtos podem ser entregues separadamente.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                6. Pagamentos e repasses
              </span>
              <div className="mt-1">
                Pagamentos são processados pela Plataforma. Podem existir
                comissões e retenções temporárias para segurança, disputas ou
                ajustes. O Lojista deve manter dados bancários corretos.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                7. Trocas, devoluções e reembolsos
              </span>
              <div className="mt-1">
                O Lojista é responsável direto por trocas, devoluções e
                reembolsos de seus produtos, respeitando o direito de
                arrependimento (7 dias). A BelaPop pode atuar como facilitadora
                da comunicação.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                8. Suspensão e encerramento
              </span>
              <div className="mt-1">
                A BelaPop pode suspender ou encerrar a conta do Lojista em caso
                de descumprimento, reclamações recorrentes, produtos irregulares
                ou práticas que prejudiquem a experiência.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                9. Limitação de responsabilidade
              </span>
              <div className="mt-1">
                A BelaPop não responde por defeitos dos produtos, atrasos de
                envio do Lojista, informações incorretas do Lojista ou danos por
                uso indevido dos produtos.
              </div>
            </li>
            <li>
              <span className="font-semibold text-bpBlackSoft">
                10. Confidencialidade e uso da marca
              </span>
              <div className="mt-1">
                O Lojista autoriza o uso de sua marca para divulgação dentro da
                Plataforma. É proibido utilizar a marca BelaPop fora da
                Plataforma sem autorização expressa.
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-10 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            Contato
          </p>
          <p className="mt-2 text-sm text-bpGraphite">
            Dúvidas, comentários, sugestões ou solicitações:{" "}
            <span className="font-semibold text-bpBlackSoft">+55 34 9804-7036</span>
          </p>
        </div>
      </div>
    </div>
  );
}
