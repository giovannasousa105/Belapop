/* eslint-disable @next/next/no-img-element */

import {
  BookOpenText,
  Bot,
  CalendarDays,
  Crown,
  LayoutDashboard,
  Mic,
  Paperclip,
  Send,
  Settings,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import Link from "next/link";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import { previewHeadlineFont } from "./luxury-preview-theme";
import {
  getBelapopHref,
  getBelapopProductHref,
  type BelapopRenderMode
} from "./routes";

const memberLinks = [
  { label: "Painel", icon: LayoutDashboard, active: false },
  { label: "Niveis de Status", icon: Crown, active: false },
  { label: "Galeria de Recompensas", icon: Sparkles, active: false },
  { label: "SkinBela AI", icon: Bot, active: true },
  { label: "Configuracoes", icon: Settings, active: false }
] as const;

const products = [
  {
    brand: "La Mer",
    name: "The Cleansing Lotion",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC9tDXMQX7CqzxKfCf2lff6-purEvLyIE0dEa7-XBtfMDQMdYrpC3KQNC7W3jCvMxoQQUaA_ZM5K-FQVqdLH9xV2x5WUWapCzjO_9s7GsyjdbMn8zGcShTg7YriS1r4hjYJJWicPLGv7mbwYK_qoAxxlCr_YVduABaLt14icjpty-D1_DKZUhgSvfvKwjAbXALuMqF6rYz86VzeLH_SOIVtWUwWKenlUDm9zqqyRr2GHs9TgAWr2vgUZ3Eoy77ZUrRVWo98gcbDmEQd"
  },
  {
    brand: "Dior Prestige",
    name: "La Mousse Micellaire",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAfqiRTZjFvxNOogpsvDXyg4ycP_9J1vIbZ9ZS1cEsg0uzyRHbLPtRDgdCnJrVUTwxHCsxW8M2FnQHjYa0Ixsyl9XYlT8wOTWRqokosn4jm4K1w9qah5zKUO0jU6sGUXbkZKPyD4uJGluORAk6pt2lKfKb8z3hpIe0Jvr9es9dT3D2_PIpbeSPPTLHinhCeu-JA5qn_ef0asrqRXgTYCSUgipVDX2RHwxIvOLvzvRN0XwwmAFcH5K9T6__y22MmPWqY1S6E8gbiGzdf"
  }
] as const;

type SkinBelaPreviewScreenProps = {
  mode?: BelapopRenderMode;
};

export function SkinBelaPreviewScreen({ mode = "preview" }: SkinBelaPreviewScreenProps) {
  return (
    <LuxuryPreviewFrame activeItem="Skin Scan Bela" mode={mode}>
      <main className="bg-[#f6f3f2] pt-[72px]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-6 flex items-center justify-between bg-white px-5 py-4 xl:hidden">
            <div>
              <p className={`${previewHeadlineFont.className} text-xl italic`}>Alexandria V.</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#747878]">
                Membro nivel gold
              </p>
            </div>
            <button className="min-h-12 bg-black px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
              Upgrade
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[230px,minmax(0,1fr),300px]">
            <aside className="hidden xl:block">
              <div className="sticky top-28 space-y-4">
                <div className="bg-white p-6">
                  <p className={`${previewHeadlineFont.className} text-2xl italic`}>Alexandria V.</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[#747878]">
                    Membro nivel gold
                  </p>
                </div>

                <nav className="space-y-2">
                  {memberLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <a
                        key={item.label}
                        href="#"
                        className={`flex items-center gap-3 px-4 py-4 text-[10px] uppercase tracking-[0.22em] ${
                          item.active
                            ? "bg-white font-bold text-black"
                            : "text-[#6b7280] transition-colors hover:bg-white hover:text-black"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <section className="overflow-hidden border border-black/6 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
              <header className="flex flex-col gap-4 border-b border-black/6 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <h1 className={`${previewHeadlineFont.className} text-2xl font-bold`}>
                    SkinBela Concierge
                  </h1>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#747878]">
                    Sessao ativa: analise de regime personalizado
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[#747878]">
                  <div className="flex -space-x-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-black text-white">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#ef75ce] text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <span>Baseado em evidencias</span>
                </div>
              </header>

              <div className="space-y-8 bg-[#f6f3f2] px-4 py-6 sm:px-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-black text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="max-w-3xl space-y-4">
                    <div className="border-l-4 border-[#ef75ce] bg-white p-6 shadow-sm">
                      <p className={`${previewHeadlineFont.className} text-lg leading-8`}>
                        Boa noite, Alexandria. Detectei queda de 12% na hidratacao epidermica da area periorbital.
                      </p>
                      <p className="mt-4 text-sm leading-7 text-[#444748]">
                        Considerando a umidade atual em Londres e seu proximo voo, recomendo migrar para uma barreira lipidica mais rica e pausar retinoides hoje.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex min-h-10 items-center gap-2 bg-[#e5e2e1] px-3 text-[10px] font-bold uppercase tracking-[0.2em]">
                        <BookOpenText className="h-3.5 w-3.5" />
                        PubMed ID: 294311
                      </span>
                      <span className="inline-flex min-h-10 items-center gap-2 bg-[#e5e2e1] px-3 text-[10px] font-bold uppercase tracking-[0.2em]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verificado por Cochrane
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-4">
                  <div className="max-w-2xl bg-black p-6 text-right text-white shadow-sm">
                    <p className={`${previewHeadlineFont.className} text-lg italic leading-8`}>
                      Sinto minha pele repuxando apos o gel de limpeza espumante. Devo trocar por uma formula em creme antes da viagem?
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#ef75ce] text-white">
                    <Crown className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-black text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="max-w-3xl space-y-4">
                    <div className="bg-white p-6 shadow-sm">
                      <p className="text-sm leading-7 text-[#444748]">
                        Sim. Agentes espumantes podem romper o manto acido quando o ponto de orvalho cai. Selecionei duas opcoes alinhadas ao seu perfil de textura e sensorial.
                      </p>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {products.map((product) => (
                          <article key={product.name} className="flex gap-4 border border-black/6 bg-[#fcf9f8] p-4">
                            <img alt={product.name} className="h-20 w-20 shrink-0 object-cover" src={product.image} />
                            <div className="flex flex-1 flex-col">
                              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#747878]">
                                Recomendado
                              </p>
                              <h4 className={`${previewHeadlineFont.className} mt-2 text-lg font-bold`}>
                                {product.brand}
                              </h4>
                              <p className="text-sm text-[#444748]">{product.name}</p>
                            <Link
                              href={getBelapopProductHref(mode)}
                              className="mt-auto self-start text-[10px] font-bold uppercase tracking-[0.2em] underline underline-offset-4"
                            >
                              Adicionar a sacola
                            </Link>
                          </div>
                        </article>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {[
                        "Como tratar minha sensibilidade?",
                        "Quais ativos a Cochrane recomenda?",
                        "Ver rotina completa"
                      ].map((item, index) => (
                        <button
                          key={item}
                          className={`min-h-11 px-4 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            index === 2
                              ? "border border-[#ef75ce] bg-white text-[#ef75ce]"
                              : "border border-black/8 bg-white text-black transition-colors hover:border-[#ef75ce] hover:text-[#ef75ce]"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <footer className="border-t border-black/6 bg-white px-4 py-4 sm:px-8">
                <div className="flex items-end gap-3">
                  <div className="relative flex-1">
                    <textarea
                      className="min-h-28 w-full resize-none border border-black/8 bg-[#f6f3f2] px-5 py-4 text-sm leading-7 placeholder:text-[#747878] focus:outline-none focus:ring-0"
                      placeholder="Descreva como sua pele esta se sentindo ou pergunte sobre um produto..."
                      rows={3}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-3 text-[#747878]">
                      <Paperclip className="h-4 w-4" />
                      <Mic className="h-4 w-4" />
                    </div>
                  </div>
                  <button className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-white transition-colors hover:bg-[#ef75ce]">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 text-center text-[9px] uppercase tracking-[0.18em] text-[#747878]">
                  O concierge SkinBela e guiado por ciencia. Consulte seu dermatologista.
                </p>
              </footer>
            </section>

            <aside className="space-y-6">
              <section className="bg-white p-6 shadow-sm">
                <div className="flex items-end justify-between">
                  <h3 className={`${previewHeadlineFont.className} text-2xl font-bold`}>
                    Diagnostico recente
                  </h3>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#747878]">2h atras</span>
                </div>
                <div className="mt-6 space-y-6">
                  {[
                    { label: "Hidratacao", value: 68, accent: true, note: "Critico: baixa umidade." },
                    { label: "Elasticidade", value: 84, accent: false, note: null },
                    { label: "Luminosidade", value: 92, accent: false, note: null }
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span>{metric.label}</span>
                        <span className={metric.accent ? "text-[#ef75ce]" : ""}>{metric.value}/100</span>
                      </div>
                      <div className="h-1 bg-[#e5e2e1]">
                        <div
                          className={`h-1 ${metric.accent ? "bg-[#ef75ce]" : "bg-black"}`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                      {metric.note ? <p className="mt-2 text-[10px] italic text-[#747878]">{metric.note}</p> : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-6 shadow-sm">
                <h3 className="border-b border-black/6 pb-3 text-[10px] font-bold uppercase tracking-[0.24em]">
                  Diario de evidencias
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    "Acido Hialuronico Topico vs Ambientes de Alta Altitude",
                    "Sintese de Ceramida-3 em Poluentes Urbanos"
                  ].map((item, index) => (
                    <div key={item} className="space-y-1">
                      <div className="flex items-start gap-3">
                        <BookOpenText className="mt-0.5 h-4 w-4 text-[#ef75ce]" />
                        <p className="text-[11px] font-bold uppercase leading-5">{item}</p>
                      </div>
                      <p className="pl-7 text-[9px] uppercase tracking-[0.18em] text-[#747878]">
                        {index === 0 ? "J Dermatol Sci (2023)" : "Clin Cosmet Investig (2024)"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#f6f3f2] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-[#ef75ce]" />
                  <h3 className={`${previewHeadlineFont.className} text-xl font-bold`}>Nota do concierge</h3>
                </div>
                <p className="mt-4 text-sm italic leading-7 text-[#444748]">
                  Sua limpeza de pele exclusiva no atelier Mayfair acontece amanha as 11:00. O especialista ja recebeu os dados desta sessao.
                </p>
                <button className="mt-5 min-h-12 w-full bg-black px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce]">
                  Gerenciar reserva
                </button>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </LuxuryPreviewFrame>
  );
}
