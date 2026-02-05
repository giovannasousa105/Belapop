"use client";

import {
  BarChart3,
  BookOpen,
  Megaphone,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Truck,
  Upload
} from "lucide-react";

import { BenefitCard } from "@/components/lojistas/BenefitCard";
import { FAQAccordion } from "@/components/lojistas/FAQAccordion";
import { HeroSeller } from "@/components/lojistas/HeroSeller";
import { SellerCTA } from "@/components/lojistas/SellerCTA";
import { SolutionsGrid } from "@/components/lojistas/SolutionsGrid";
import { Steps } from "@/components/lojistas/Steps";

const benefits = [
  {
    title: "Exposição e canais",
    description:
      "Vitrines editoriais, campanhas qualificadas e canais digitais conforme critérios de curadoria.",
    icon: Megaphone
  },
  {
    title: "Painel com dados",
    description:
      "Indicadores de vendas, ticket, conversão e catálogo para gestão objetiva e governança.",
    icon: BarChart3
  },
  {
    title: "Logística descomplicada",
    description:
      "Fretes por lojista com múltiplas origens e experiência consistente, conforme política comercial.",
    icon: Truck
  },
  {
    title: "Cupons e campanhas",
    description:
      "Ações controladas para fortalecer posicionamento e conversão, alinhadas às diretrizes editoriais.",
    icon: Ticket
  },
  {
    title: "Cadastro rápido de produtos",
    description:
      "Publicação de coleções com dados estruturados e diretrizes editoriais.",
    icon: Upload
  },
  {
    title: "Treinamentos e playbooks",
    description:
      "Playbooks e diretrizes para padronizar operação, catálogo e comunicação.",
    icon: BookOpen
  }
];

const steps = [
  {
    title: "Cadastre sua loja",
    description:
      "Informe dados da marca, responsável e categoria principal para análise e validação.",
    icon: Store
  },
  {
    title: "Envie seu portfólio",
    description:
      "Apresente produtos, diferenciais e materiais conforme diretrizes editoriais.",
    icon: Upload
  },
  {
    title: "Curadoria e publicação",
    description:
      "Ajustamos a vitrine e publicamos conforme critérios de curadoria.",
    icon: Sparkles
  },
  {
    title: "Cresça com a BelaPop",
    description:
      "Acompanhe performance, campanhas e métricas com governança institucional.",
    icon: TrendingUp
  }
];

const solutions = [
  {
    tag: "Pagamentos",
    title: "BelaPay",
    description:
      "Pagamentos integrados, checkout único e repasses organizados por lojista, conforme política comercial."
  },
  {
    tag: "Logística",
    title: "BelaShip",
    description:
      "Fretes por lojista, múltiplas origens e experiência consistente para o cliente, com SLA definido."
  },
  {
    tag: "Visibilidade",
    title: "BelaAds",
    description:
      "Destaques e espaços editoriais para campanhas e lançamentos com critérios de curadoria."
  },
  {
    tag: "Treinamentos",
    title: "BelaAcademy",
    description:
      "Playbooks e diretrizes para formação, compliance e evolução contínua da operação."
  }
];

const faqItems = [
  {
    question: "Quais marcas podem integrar a BelaPop?",
    answer:
      "Marcas de beleza, bem-estar e autocuidado alinhadas à curadoria editorial e aos padrões de qualidade e apresentação definidos pela BelaPop."
  },
  {
    question: "Existe cobrança de mensalidade?",
    answer:
      "No MVP não há mensalidade fixa. O modelo prevê comissão sobre vendas e soluções opcionais, conforme política comercial vigente."
  },
  {
    question: "Como funciona o checkout único?",
    answer:
      "O cliente conclui um único pedido. A BelaPop realiza a organização interna de envios e repasses por lojista, com transparência operacional."
  },
  {
    question: "Como é feita a gestão do catálogo?",
    answer:
      "O painel permite criação, edição e publicação de produtos, respeitando diretrizes editoriais e padrões de qualidade."
  },
  {
    question: "Como é calculado o frete por lojista?",
    answer:
      "Cada loja informa seu CEP de origem. O sistema calcula fretes por lojista e soma no checkout, preservando a experiência do cliente."
  },
  {
    question: "Há suporte para campanhas e visibilidade?",
    answer:
      "Sim. Oferecemos diretrizes, materiais de apoio e oportunidades editoriais conforme disponibilidade e critérios de curadoria."
  },
  {
    question: "Política comercial e compliance",
    answer:
      "A participação está sujeita à política comercial, critérios de curadoria e diretrizes de compliance. Condições podem ser ajustadas conforme avaliação contínua da operação."
  }
];

export default function LojistasPage() {
  return (
    <div className="bg-white text-noir-900">
      <HeroSeller />

      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
              Benefícios BelaPop
            </p>
            <h2 className="mt-3 font-display text-3xl text-noir-950">
              Por que vender na BelaPop
            </h2>
            <p className="mt-3 text-sm text-noir-600">
              Operação estruturada, diretrizes editoriais e governança comercial
              para marcas com posicionamento premium.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
              Como funciona
            </p>
            <h2 className="mt-3 font-display text-3xl text-noir-950">
              Processo estruturado em quatro etapas.
            </h2>
            <p className="mt-3 text-sm text-noir-600">
              Onboarding claro, com critérios de curadoria e alinhamento de marca.
            </p>
          </div>
          <Steps steps={steps} />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
              Soluções do ecossistema
            </p>
            <h2 className="mt-3 font-display text-3xl text-noir-950">
              Ecossistema BelaPop
            </h2>
            <p className="mt-3 text-sm text-noir-600">
              Pagamentos, logística, visibilidade e formação em um único ambiente.
            </p>
          </div>
          <SolutionsGrid items={solutions} />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
              Dúvidas frequentes
            </p>
            <h2 className="mt-3 font-display text-3xl text-noir-950">
              Perguntas frequentes
            </h2>
            <p className="mt-3 text-sm text-noir-600">
              Esclarecimentos essenciais sobre curadoria, operação e política comercial.
            </p>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      <SellerCTA />
    </div>
  );
}
