import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Package2,
  Paperclip,
  Search,
  SendHorizonal,
  Settings,
  ShoppingBag,
  SmilePlus
} from "lucide-react";

import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

type SellerCommunicationPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const theme = {
  "--seller-comm-bg": "#fbf9f4",
  "--seller-comm-sidebar": "#f5f4ed",
  "--seller-comm-surface": "#ffffff",
  "--seller-comm-surface-low": "#f8f6f1",
  "--seller-comm-surface-muted": "#efeee6",
  "--seller-comm-border": "rgba(177, 179, 169, 0.16)",
  "--seller-comm-text": "#31332c",
  "--seller-comm-text-soft": "#5e6058",
  "--seller-comm-outline": "#797c73",
  "--seller-comm-primary": "#5f5e5e",
  "--seller-comm-secondary": "#6e5b4d",
  "--seller-comm-tertiary": "#a23d3e",
  "--seller-comm-shadow": "0 18px 40px rgba(49, 51, 44, 0.04)",
  "--seller-comm-radius": "16px"
} as CSSProperties;

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type ThreadItem = {
  sellerId?: string;
  seller: string;
  code: string;
  time: string;
  preview: string;
  status: "pending" | "read";
  active?: boolean;
};

type ConversationMessage = {
  id: string;
  author: string;
  role: string;
  time: string;
  body: string;
  tone: "surface" | "dark";
};

type ProfileEvent = {
  title: string;
  description: string;
  date: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Catalogo", href: "/adm/catalogo-marca/inteligencia", icon: Package2 },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Comunicacao", href: "/adm/operacao/comunicacao-sellers", icon: MessageSquare, active: true },
  { label: "Configuracoes", href: "/adm/gestao/configuracoes", icon: Settings }
];

const filters = [
  { label: "Seller", value: "Todos" },
  { label: "Status", value: "Pendentes" },
  { label: "Data", value: "Ultimos 7 dias" }
] as const;

const threads: ThreadItem[] = [
  {
    seller: "Atelier Lumiere",
    code: "#C 88291",
    time: "14:20",
    preview: "Revisao do status do pedido #2938 e ajuste necessario na integracao da nova colecao.",
    status: "pending",
    active: true
  },
  {
    seller: "Maison Homme",
    code: "#C 77210",
    time: "Ontem",
    preview: "Conferencia de disponibilidade para a colecao de verao e lead time de producao.",
    status: "read"
  },
  {
    seller: "Joias Raras",
    code: "#C 90124",
    time: "12 Out",
    preview: "Confirmacao de recebimento do material de onboarding e checklist final de aprovacao.",
    status: "read"
  }
];

const messages: ConversationMessage[] = [
  {
    id: "seller-1",
    author: "Maria (Manager)",
    role: "Atelier Lumiere",
    time: "10:15",
    body: "Ola BelaPop Team, estamos com uma duvida tecnica sobre a integracao da nossa nova colecao. O campo de SKU esta retornando erro na API.",
    tone: "surface"
  },
  {
    id: "support-1",
    author: "BelaPop System (Suporte)",
    role: "Suporte tecnico",
    time: "10:32",
    body: "Ola Maria, verifiquei com nosso time de engenharia. Parece que o formato do JSON enviado esta com uma virgula excedente na linha 42. Poderia validar?",
    tone: "dark"
  },
  {
    id: "seller-2",
    author: "Maria (Manager)",
    role: "Atelier Lumiere",
    time: "10:48",
    body: "Perfeito. Era exatamente isso. Ja removemos o campo duplicado e a publicacao voltou a responder normalmente. Obrigada pelo retorno rapido.",
    tone: "surface"
  }
];

const profileEvents: ProfileEvent[] = [
  {
    title: "Ajuste de Imagem",
    description: "Solicitacao concluida para novas imagens de campanha editorial.",
    date: "02 OUT, 2023"
  },
  {
    title: "Atualizacao de Contrato",
    description: "Revisao de clausulas comerciais e renovacao do plano premium.",
    date: "15 SET, 2023"
  }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] uppercase tracking-[0.22em] transition-colors ${
        item.active
          ? "bg-[var(--seller-comm-surface)] font-semibold text-[var(--seller-comm-text)] shadow-[var(--seller-comm-shadow)]"
          : "text-[var(--seller-comm-text-soft)] hover:bg-[rgba(255,255,255,0.7)] hover:text-[var(--seller-comm-text)]"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

function ThreadChip({ status }: { status: ThreadItem["status"] }) {
  const classes =
    status === "pending"
      ? "bg-[rgba(110,91,77,0.12)] text-[var(--seller-comm-secondary)]"
      : "bg-[var(--seller-comm-surface-muted)] text-[var(--seller-comm-text-soft)]";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${classes}`}
    >
      {status === "pending" ? "Pendente" : "Lido"}
    </span>
  );
}

function ThreadCard({ item }: { item: ThreadItem }) {
  return (
    <button
      type="button"
      className={`w-full rounded-[var(--seller-comm-radius)] border px-4 py-4 text-left transition-colors ${
        item.active
          ? "border-[rgba(110,91,77,0.26)] bg-[var(--seller-comm-surface-low)] shadow-[var(--seller-comm-shadow)]"
          : "border-transparent bg-transparent hover:border-[var(--seller-comm-border)] hover:bg-[var(--seller-comm-surface-low)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--seller-comm-text)]">{item.seller}</h3>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--seller-comm-text-soft)]">
            {item.code}
          </p>
        </div>
        <span className="text-[10px] text-[var(--seller-comm-text-soft)]">{item.time}</span>
      </div>

      <p className="mt-3 text-[12px] leading-5 text-[var(--seller-comm-text-soft)]">{item.preview}</p>

      <div className="mt-4">
        <ThreadChip status={item.status} />
      </div>
    </button>
  );
}

function FilterControl({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] px-4 text-[10px] uppercase tracking-[0.2em] text-[var(--seller-comm-text-soft)]"
    >
      <span className="font-medium text-[var(--seller-comm-outline)]">{label}:</span>
      <span className="text-[var(--seller-comm-text)]">{value}</span>
      <ChevronDown className="h-3.5 w-3.5 text-[var(--seller-comm-outline)]" strokeWidth={1.8} />
    </button>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isDark = message.tone === "dark";

  return (
    <div className={`flex ${isDark ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[78%] rounded-[20px] px-5 py-4 shadow-[var(--seller-comm-shadow)] ${
          isDark
            ? "bg-[var(--seller-comm-primary)] text-white"
            : "border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] text-[var(--seller-comm-text)]"
        }`}
      >
        <p className="text-[13px] leading-6">{message.body}</p>
        <div
          className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] ${
            isDark ? "text-white/70" : "text-[var(--seller-comm-text-soft)]"
          }`}
        >
          <span>{message.time}</span>
          <span>Enviado por: {message.author}</span>
          <span>{message.role}</span>
        </div>
      </article>
    </div>
  );
}

export async function SellerCommunicationPage({
  filters: _filters,
  searchParamsSource: _searchParamsSource
}: SellerCommunicationPageProps) {
  const data = await getAdmDataSource();
  const sellerMap = Object.fromEntries(data.sellers.map((seller) => [seller.id, seller]));
  const productMap = Object.fromEntries(data.products.map((product) => [product.id, product]));
  const liveThreads: ThreadItem[] = [
    ...data.logisticsIncidents.map((incident) => ({
      sellerId: incident.sellerId,
      seller: sellerMap[incident.sellerId]?.name ?? "Seller removido",
      code: incident.id.toUpperCase(),
      time: new Date(incident.openedAt).toLocaleDateString("pt-BR"),
      preview: incident.summary,
      status: incident.priority === "critica" ? ("pending" as const) : ("read" as const),
      active: false
    })),
    ...data.financialAlerts.map((alert) => ({
      sellerId: alert.sellerId,
      seller: sellerMap[alert.sellerId]?.name ?? "Seller removido",
      code: alert.id.toUpperCase(),
      time: new Date(alert.createdAt).toLocaleDateString("pt-BR"),
      preview: alert.summary,
      status: alert.priority === "critica" ? ("pending" as const) : ("read" as const),
      active: false
    })),
    ...data.documents
      .filter((document) => document.status !== "aprovado")
      .map((document) => ({
        sellerId: document.sellerId,
        seller: sellerMap[document.sellerId]?.name ?? "Seller removido",
        code: document.id.toUpperCase(),
        time: document.dueDate,
        preview: `${document.type} sob responsabilidade de ${document.owner}.`,
        status: document.status === "bloqueado" ? ("pending" as const) : ("read" as const),
        active: false
      }))
  ];
  const visibleThreads = (liveThreads.length > 0 ? liveThreads : threads).map((thread, index) => ({
    ...thread,
    active: index === 0
  }));
  const selectedThread = visibleThreads[0];
  const selectedSeller = data.sellers.find((seller) => seller.name === selectedThread?.seller);
  const visibleMessages = messages.map((message, index) =>
    index === 0 || index === 2
      ? {
          ...message,
          author: selectedThread?.seller ?? message.author,
          role: selectedThread?.seller ?? message.role
        }
      : message
  );
  const visibleProfileEvents =
    selectedSeller != null
      ? [
          {
            title: "Atualizacao de score",
            description: `Seller com score atual de ${selectedSeller.qualityScore} e risco ${selectedSeller.riskLevel}.`,
            date: "Atual"
          },
          {
            title: "Status operacional",
            description: `${selectedSeller.pendingDocuments} documento(s) pendente(s) e ${selectedSeller.activeProducts} SKU(s) ativos.`,
            date: "Backoffice"
          }
        ]
      : profileEvents;
  return (
    <div
      className="min-h-screen bg-[var(--seller-comm-bg)] text-[var(--seller-comm-text)]"
      style={theme}
    >
      <div className="mx-auto flex min-h-screen max-w-[1280px]">
        <aside className="flex w-[248px] shrink-0 flex-col bg-[var(--seller-comm-sidebar)] px-5 py-8">
          <div className="px-2">
            <h1 className={`text-[1.8rem] tracking-[-0.04em] ${notoSerif.className}`}>BelaPop</h1>
            <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[var(--seller-comm-text-soft)]">
              Backoffice Elite
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {sidebarItems.map((item) => (
              <SidebarLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-auto rounded-[var(--seller-comm-radius)] border border-[var(--seller-comm-border)] bg-[rgba(255,255,255,0.62)] p-4">
            <p className="text-[11px] font-semibold text-[var(--seller-comm-text)]">Admin Premium</p>
            <p className="mt-1 text-[10px] text-[var(--seller-comm-text-soft)]">admin@belapop.com</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">
          <header className="flex items-start justify-between gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--seller-comm-text-soft)]">
                Canal operacional
              </p>
              <h2
                className={`mt-2 text-[2.4rem] leading-none tracking-[-0.04em] ${notoSerif.className}`}
              >
                Comunicacao com Parceiros
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--seller-comm-text-soft)]"
                  strokeWidth={1.8}
                />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  className="h-11 w-[320px] rounded-full border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] pl-11 pr-4 text-[12px] text-[var(--seller-comm-text)] outline-none placeholder:text-[var(--seller-comm-text-soft)]"
                />
              </label>

              <button
                type="button"
                aria-label="Notificacoes"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] text-[var(--seller-comm-text-soft)]"
              >
                <Bell className="h-4 w-4" strokeWidth={1.8} />
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center rounded-full bg-[var(--seller-comm-primary)] px-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-white"
              >
                Nova mensagem
              </button>
            </div>
          </header>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {filters.map((filter) => (
                <FilterControl key={filter.label} label={filter.label} value={filter.value} />
              ))}
            </div>

            <div className="inline-flex rounded-full border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] p-1">
              <button
                type="button"
                className="rounded-full bg-[var(--seller-comm-surface-low)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--seller-comm-text)]"
              >
                Inbox
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--seller-comm-text-soft)]"
              >
                Arquivadas
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[296px_minmax(0,1fr)_272px] gap-6">
            <section className="rounded-[var(--seller-comm-radius)] border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] p-4 shadow-[var(--seller-comm-shadow)]">
              <div className="flex items-center justify-between px-1 pb-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--seller-comm-text-soft)]">
                  Conversas
                </p>
                <button
                  type="button"
                  aria-label="Filtrar conversas"
                  className="text-[var(--seller-comm-text-soft)]"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>

              <div className="space-y-2">
                {visibleThreads.map((thread) => (
                  <ThreadCard key={thread.code} item={thread} />
                ))}
              </div>
            </section>

            <section className="flex min-h-[700px] flex-col rounded-[var(--seller-comm-radius)] border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] shadow-[var(--seller-comm-shadow)]">
              <div className="flex items-center justify-between border-b border-[var(--seller-comm-border)] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--seller-comm-surface-muted)] text-sm font-semibold text-[var(--seller-comm-secondary)]">
                    AL
                  </div>
                  <div>
                    <h3 className={`text-[1.2rem] leading-none ${notoSerif.className}`}>
                      {selectedThread?.seller ?? "Sem seller selecionado"}
                    </h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--seller-comm-text-soft)]">
                      Premium Partner
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[rgba(162,61,62,0.08)] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--seller-comm-tertiary)]">
                    Notificar ajuste necessario
                  </span>
                  <button
                    type="button"
                    aria-label="Mais acoes"
                    className="text-[var(--seller-comm-text-soft)]"
                  >
                    <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              <div className="flex-1 px-6 py-6">
                <p className="text-center text-[10px] uppercase tracking-[0.24em] text-[var(--seller-comm-text-soft)]">
                  14 de outubro, 2023
                </p>

                <div className="mt-8 space-y-5">
                  {visibleMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--seller-comm-border)] px-6 py-5">
                <div className="flex items-center gap-3 rounded-[18px] border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface-low)] px-4 py-3">
                  <button
                    type="button"
                    aria-label="Anexar arquivo"
                    className="text-[var(--seller-comm-text-soft)]"
                  >
                    <Paperclip className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  <input
                    type="text"
                    value="Escreva sua mensagem"
                    readOnly
                    className="flex-1 bg-transparent text-[13px] text-[var(--seller-comm-text-soft)] outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Inserir emoji"
                    className="text-[var(--seller-comm-text-soft)]"
                  >
                    <SmilePlus className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    aria-label="Enviar mensagem"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--seller-comm-primary)] text-white"
                  >
                    <SendHorizonal className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[var(--seller-comm-text-soft)]">
                  <span>Shift + Enter para nova linha</span>
                  <button type="button">Copia para e-mail</button>
                </div>
              </div>
            </section>

            <aside className="rounded-[var(--seller-comm-radius)] border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] p-5 shadow-[var(--seller-comm-shadow)]">
              <div className="relative h-[196px] w-full overflow-hidden rounded-[20px]">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFUjmi9oir9rRKvkYMvVkBPfCXi_s8_bG5-nNg44VdMr7vOZl3OVWrjLTcEeKDKEY_Fe1TKO4dOMSnPEeQ9U1KWWPMxyyejJDu94wdvDCvnMePmEaCe6AxE10tLYw6G5ithtaF8mWdn4MSbhE_L1noZDqIkkiUhdEMClzdLDBb5PxTGcZy-SI8GnmrFgXi4pdn2nujTa5y5LtHqUUSPqkkltYdGq9C-uuLvUpcWDsKwtdfc4-38NOOT1U_BzW0GDPVWbg26B8CBoq9"
                  alt="portrait of a premium fashion partner in soft editorial lighting"
                  fill
                  priority
                  sizes="272px"
                  className="object-cover"
                />
              </div>

              <div className="mt-5 text-center">
                <h3 className={`text-[1.5rem] tracking-[-0.03em] ${notoSerif.className}`}>
                  {selectedThread?.seller ?? "Sem seller selecionado"}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--seller-comm-text-soft)]">
                  Paris &amp; Sao Paulo
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-[var(--seller-comm-surface-low)] px-4 py-3 text-center">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--seller-comm-text-soft)]">
                    Score
                  </p>
                  <p className={`mt-2 text-[1.4rem] ${notoSerif.className}`}>
                    {selectedSeller ? (selectedSeller.qualityScore / 20).toFixed(1) : "4.9"}
                  </p>
                </div>
                <div className="rounded-[14px] bg-[var(--seller-comm-surface-low)] px-4 py-3 text-center">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--seller-comm-text-soft)]">
                    Vendas
                  </p>
                  <p className={`mt-2 text-[1.4rem] ${notoSerif.className}`}>
                    {selectedSeller ? `${selectedSeller.activeProducts}` : "1.2k"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--seller-comm-text-soft)]">
                  Informacoes do perfil
                </p>
                <div className="mt-4 space-y-4 text-[12px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-[var(--seller-comm-text-soft)]">Parceiro desde</span>
                    <span className="font-medium text-[var(--seller-comm-text)]">Jan 2022</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[var(--seller-comm-text-soft)]">Categoria</span>
                    <span className="font-medium text-[var(--seller-comm-text)]">
                      {selectedSeller?.category ?? "Alta Costura"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[var(--seller-comm-text-soft)]">Taxa de resposta</span>
                    <span className="font-medium text-[var(--seller-comm-text)]">
                      {selectedSeller ? `${Math.max(72, selectedSeller.qualityScore)}%` : "98%"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-[var(--seller-comm-border)] pt-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--seller-comm-text-soft)]">
                  Historico de notificacoes
                </p>
                <div className="mt-4 space-y-4">
                  {visibleProfileEvents.map((event) => (
                    <article
                      key={event.title}
                      className="rounded-[14px] bg-[var(--seller-comm-surface-low)] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-[12px] font-semibold text-[var(--seller-comm-text)]">
                            {event.title}
                          </h4>
                          <p className="mt-2 text-[11px] leading-5 text-[var(--seller-comm-text-soft)]">
                            {event.description}
                          </p>
                        </div>
                        <Mail
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--seller-comm-text-soft)]"
                          strokeWidth={1.8}
                        />
                      </div>
                      <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-[var(--seller-comm-text-soft)]">
                        {event.date}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--seller-comm-border)] bg-[var(--seller-comm-surface)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--seller-comm-text)]"
              >
                Ver perfil completo
              </button>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
