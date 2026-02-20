"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/CartContext";
import { usePublishedDiaryPosts } from "@/lib/hooks/useDiaryPosts";

type FlowVariant = "customer" | "seller";

type FlowCta = { label: string; href: string };

type FlowOption = {
  id: string;
  label: string;
  lead: string;
  detail: React.ReactNode[];
  subtopics?: string[];
  ctas?: FlowCta[];
};

type DiaryLink = {
  title: string;
  slug: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: React.ReactNode;
  auto?: boolean;
};

const DEFAULT_DIARY_STORIES: DiaryLink[] = [
  { title: "O ritual da noite elegante", slug: "ritual-noite" },
  { title: "Perfumes que contam hist�rias", slug: "perfumaria-historias" }
];

const initialPrompt =
  "Quero entender a curadoria editorial mais adequada para o meu momento.";

const sellerFlowOptions: FlowOption[] = [
  {
    id: "orders",
    label: "Pedidos e repasses",
    lead:
      "Acompanhe o fluxo editorial dos pedidos e mantenha os repasses alinhados ao time BelaPop.",
    detail: [
      "Use o painel de pedidos para revisar status e confirmar separa��o antes do despacho.",
      "Os repasses s�o acionados quando cada lojista valida o envio � assim a curadoria preserva o tom premium."
    ],
    subtopics: ["Pedidos", "Repasses"],
    ctas: [{ label: "Ver pedidos", href: "/seller/orders" }]
  },
  {
    id: "catalog",
    label: "Cat�logo BelaPop",
    lead: "Atualize cat�logo e garanta que seus lan�amentos entrem na curadoria editorial.",
    detail: [
      "Produtos aprovados aparecem com destaque enquanto o time de curadoria revisa as texturas e embalagens.",
      "Ajuste descri��es, imagens e pricing direto no gerenciamento para refletir o storytelling desejado."
    ],
    subtopics: ["Curadoria", "Aprova��es"],
    ctas: [{ label: "Gerenciar cat�logo", href: "/seller/products" }]
  },
  {
    id: "logistics",
    label: "Frete e opera��o",
    lead: "Explique aos lojistas como o marketplace calcula frete e prazos por origem.",
    detail: [
      "Cada lojista informa prazos e valores; o painel consolida a entrega final para o cliente.",
      "Separe embalagens premium e informe o n�mero de rastreio para manter o relato editorial do pedido."
    ],
    subtopics: ["Envios", "Marketplace"],
    ctas: [{ label: "Acessar log�stica", href: "/seller/dashboard" }]
  }
];

const buildCustomerFlowOptions = (
  diaryLinks: DiaryLink[],
  cartItemCount: number,
  cartStatus: string | null
): FlowOption[] => {
  const diaries = diaryLinks.length ? diaryLinks : DEFAULT_DIARY_STORIES;
  const diaryDetails = diaries.map((story) => (
    <Link
      key={story.slug}
      href={`/diario/${story.slug}`}
      className="text-sm text-bpPink underline decoration-bpPink"
    >
      Ler {story.title}
    </Link>
  ));
  const shippingLines: string[] = [
    "Cada lojista calcula o frete e o prazo � o marketplace consolida as entregas em um �nico resumo editorial.",
    cartItemCount
      ? `Voc� j� tem ${cartItemCount} ${cartItemCount === 1 ? "item" : "itens"} no carrinho; o c�lculo se atualiza automaticamente.`
      : "Adicione itens � curadoria para ver o frete estimado em segundos."
  ];
  if (cartStatus === "abandoned") {
    shippingLines.push(
      "O carrinho foi marcado como abandonado h� mais de 2 horas; retome o pedido quando quiser continuar."
    );
  }

  return [
    {
      id: "choose",
      label: "Ajuda para escolher",
      lead:
        "Conte o contexto � rotina, presente ou tipo de pele � e eu monto a curadoria editorial perfeita.",
      detail: [
        "Rotina: selecione combina��es leves para manh�s cheias de presen�a ou texturas reconfortantes para a noite.",
        "Presente: monte kits com embalagens sofisticadas e hist�rias de aroma para surpreender quem voc� ama.",
        "Tipo de pele: sugiro texturas equilibradas para sens�veis, mistas ou oleosas."
      ],
      subtopics: ["Rotina", "Presente", "Tipo de pele"],
      ctas: [{ label: "Explorar curadoria", href: "/catalogo" }]
    },
    {
      id: "shipping",
      label: "Frete e prazo",
      lead: "Explico o c�lculo do frete e o cronograma dos lojistas do marketplace.",
      detail: shippingLines,
      subtopics: ["Marketplace", "Entrega"],
      ctas: [{ label: "Calcular frete", href: "/carrinho" }]
    },
    {
      id: "cart",
      label: "Carrinho ou pedido",
      lead: "Retomar, ajustar ou finalizar a compra com a mesma linguagem editorial.",
      detail: [
        "Retomar: abra o carrinho e veja os itens com o olhar curatorial que voc� escolheu.",
        "Ajustar: mude quantidades, acrescente complementares e harmonize a narrativa antes de concluir.",
        "Finalizar: siga para o checkout e garanta que o pedido mantenha a sensa��o premium at� o envio."
      ],
      subtopics: ["Retomar", "Ajustar", "Finalizar"],
      ctas: [
        { label: "Ir para o carrinho", href: "/carrinho" },
        { label: "Finalizar compra", href: "/checkout" }
      ]
    },
    {
      id: "diario",
      label: "Di�rio BelaPop",
      lead: "Links editoriais com rotinas, hist�rias e texturas contadas pela Curadoria.",
      detail: [
        "Edi��es novas e cl�ssicas do Di�rio inspiram o look e o ritual do dia a dia.",
        ...diaryDetails
      ],
      subtopics: ["Narrativa", "Inspira��o"],
      ctas: [{ label: "Ler o Di�rio completo", href: "/diario" }]
    }
  ];
};

const getPageType = (path: string | null) => {
  if (!path || path === "/") return "home";
  if (path.startsWith("/produto")) return "product";
  if (path === "/carrinho") return "cart";
  if (path === "/checkout") return "checkout";
  return "page";
};

const renderFlowContent = (flow: FlowOption) => (
  <div className="space-y-3">
    <p className="text-sm text-bpBlackSoft">{flow.lead}</p>
    <div className="space-y-2 text-sm text-bpGraphite/80">
      {flow.detail.map((item, index) => (
        <div key={`${flow.id}-detail-${index}`} className="leading-relaxed">
          {item}
        </div>
      ))}
    </div>
    {flow.subtopics ? (
      <div className="flex flex-wrap gap-2">
        {flow.subtopics.map((topic) => (
          <span
            key={topic}
            className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70"
          >
            {topic}
          </span>
        ))}
      </div>
    ) : null}
    {flow.ctas ? (
      <div className="flex flex-wrap gap-2">
        {flow.ctas.map((cta) => (
          <Link
            key={cta.href}
            href={cta.href}
            className="rounded-full bg-bpPink px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white"
          >
            {cta.label}
          </Link>
        ))}
      </div>
    ) : null}
  </div>
);

export const CuradoriaChat = ({ variant }: { variant: FlowVariant }) => {
  const pathname = usePathname();
  const { items, cartId } = useCart();
  const { posts } = usePublishedDiaryPosts();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      auto: true,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-bpBlackSoft">
            Posso te orientar sobre pedidos, produtos ou pr�ximas escolhas.
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
            Orienta��o autom�tica � Conversa guiada
          </p>
        </div>
      )
    }
  ]);
  const [inputValue, setInputValue] = useState(initialPrompt);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [cartStatus, setCartStatus] = useState<string | null>(null);
  const [cartNoteAdded, setCartNoteAdded] = useState(false);
  const messageIdRef = useRef(0);
  const nextMessageId = (prefix: string) => `${prefix}-${messageIdRef.current++}`;

  useEffect(() => {
    if (!cartId) {
      setCartStatus(null);
      setCartNoteAdded(false);
      return;
    }
    let isCurrent = true;
    const fetchStatus = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from("carts")
          .select("status")
          .eq("id", cartId)
          .maybeSingle();
        if (!isCurrent) return;
        setCartStatus(data?.status ?? null);
      } catch (error) {
        console.error("[CuradoriaChat] erro ao buscar status do carrinho", error);
      }
    };
    void fetchStatus();
    return () => {
      isCurrent = false;
    };
  }, [cartId]);

  useEffect(() => {
    if (cartStatus === "abandoned" && !cartNoteAdded) {
      const abandonedMessage: ChatMessage = {
        id: "abandoned",
        role: "assistant",
        auto: true,
        content: (
          <div className="space-y-2">
            <p className="text-sm text-bpBlackSoft">
              Notamos que seu carrinho ficou marcado como abandonado h� mais de 2 horas. Posso retomar a sele��o sempre que quiser.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/carrinho"
                className="rounded-full bg-bpPink px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white"
              >
                Retomar carrinho
              </Link>
              <Link
                href="/checkout"
                className="rounded-full bg-bpPink px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white"
              >
                Finalizar pedido
              </Link>
            </div>
          </div>
        )
      };
      setMessages((prev) => [...prev, abandonedMessage]);
      setCartNoteAdded(true);
    }
  }, [cartStatus, cartNoteAdded]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("open-curadoria-chat", handleOpen);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("open-curadoria-chat", handleOpen);
      }
    };
  }, []);

  const diaryLinks = useMemo(() => posts.slice(0, 2).map((post) => ({ title: post.title, slug: post.slug })), [posts]);
  const flowOptions = useMemo<FlowOption[]>(
    () => (variant === "seller" ? sellerFlowOptions : buildCustomerFlowOptions(diaryLinks, cartItemCount, cartStatus)),
    [variant, diaryLinks, cartItemCount, cartStatus]
  );

  const pageType = getPageType(pathname ?? null);
  const productId = pathname?.startsWith("/produto/") ? pathname.split("/")[2] ?? null : null;
  const contextLabel = `Contexto: ${pageType} � Produto ${productId ?? "�"} � Carrinho ${cartStatus ?? "sem status"}`;

  const appendFlowMessage = (flow: FlowOption) => {
    const flowMessage: ChatMessage = {
      id: nextMessageId(`flow-${flow.id}`),
      role: "assistant",
      auto: true,
      content: renderFlowContent(flow)
    };
    setMessages((prev) => [...prev, flowMessage]);
    setActiveFlowId(flow.id);
    setInputValue(flow.lead);
  };

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = {
      id: nextMessageId("user"),
      role: "user",
      content: <p className="text-sm text-bpBlackSoft">{trimmed}</p>
    };
    const autoReply: ChatMessage = {
      id: nextMessageId("auto"),
      role: "assistant",
      auto: true,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-bpBlackSoft">
            Recebi sua mensagem e mantenho o tom editorial enquanto preparo sugest�es alinhadas ao seu contexto.
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">Orienta��o autom�tica � Curadoria BelaPop</p>
        </div>
      )
    };
    setMessages((prev) => [...prev, userMessage, autoReply]);
    setInputValue(initialPrompt);
    setActiveFlowId(null);
  };

  const contactHref = "mailto:atendimento@belapop.com?subject=Curadoria%20BelaPop";
  const handleHuman = () => {
    if (typeof window !== "undefined") {
      window.location.href = contactHref;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="pointer-events-auto w-[320px] rounded-[32px] border border-[#F6D6E2] bg-white p-0 shadow-bpSoft">
          <div className="flex items-start justify-between rounded-[32px] bg-white p-5">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.4em] text-bpGraphite/70">Curadoria BelaPop</p>
              <p className="text-lg font-display text-bpBlack">Curadoria BelaPop Chat</p>
              <p className="text-[11px] text-bpGraphite/70">Orienta��o autom�tica � Editorial premium</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-black/10 px-2 py-1 text-xs text-bpGraphite/70"
              aria-label="Fechar chat"
            >
              �
            </button>
          </div>
          <div className="space-y-3 border-t border-[#F6D6E2] px-5 pt-3">
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl border border-black/10 bg-white p-3 text-sm ${
                    message.role === "user" ? "self-end text-bpBlackSoft" : "text-bpGraphite"
                  }`}
                >
                  {message.content}
                  {message.auto ? (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">Orienta��o autom�tica</p>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Atalhos</p>
              <div className="grid grid-cols-2 gap-2">
                {flowOptions.map((flow) => (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => appendFlowMessage(flow)}
                    aria-pressed={activeFlowId === flow.id}
                    className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white transition ${
                      activeFlowId === flow.id ? "bg-bpBlack" : "bg-bpPink"
                    }`}
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSend} className="space-y-2">
              <label htmlFor="curadoria-chat" className="sr-only">
                Mensagem para Curadoria BelaPop
              </label>
              <textarea
                id="curadoria-chat"
                rows={2}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm text-bpBlackSoft focus:border-bpPink focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-bpPink px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white"
              >
                Enviar
              </button>
            </form>
            <div>
              <button
                type="button"
                onClick={handleHuman}
                className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-bpBlackSoft"
              >
                Falar com atendimento
              </button>
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
                Atendimento humano dispon�vel para d�vidas al�m da orienta��o autom�tica.
              </p>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-bpGraphite/70">{contextLabel}</div>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto flex items-center justify-center rounded-full border border-black/10 bg-white p-3 shadow-bpMicro"
        aria-label="Abrir chat Curadoria BelaPop"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-bpBlack">CB</span>
      </button>
    </div>
  );
};


