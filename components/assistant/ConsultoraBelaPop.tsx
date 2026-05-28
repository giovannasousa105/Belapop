"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Headset,
  Loader2,
  MessageCircleMore,
  Repeat,
  ScanFace,
  WandSparkles,
  X
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  CONSULTORA_BELAPOP_OPEN_EVENT,
  LEGACY_CURADORIA_OPEN_EVENT,
  dispatchConsultoraBelaPopOpen,
  type ConsultoraBelaPopOpenDetail
} from "@/lib/assistant/events";
import {
  getConsultoraMobileDockOffset,
  isConsultoraBelaPopEnabledPath
} from "@/lib/assistant/surfaces";
import { brandCtas } from "@/lib/brand/ctas";
import {
  type AssistantBudget,
  type AssistantFlow,
  type AssistantRecommendationCard,
  type AssistantRecommendationResponse,
  type AssistantRequest,
  type GiftInterest,
  type GiftTone,
  type RoutineDepth,
  type RoutineObjective,
  type RoutineSkinType
} from "@/lib/assistant/types";
import { trackEvent } from "@/lib/analytics/tracker";
import { useCart } from "@/lib/CartContext";
import { postCustomerReorder } from "@/lib/customer/api";
import { formatPrice } from "@/lib/utils";

type ConsultoraBelaPopContextValue = {
  isOpen: boolean;
  open: (detail?: ConsultoraBelaPopOpenDetail) => void;
  close: () => void;
};

type RoutineAnswers = {
  objective?: RoutineObjective;
  skinType?: RoutineSkinType;
  depth?: RoutineDepth;
  budget?: AssistantBudget;
  time?: RoutineTime;
};

type GiftAnswers = {
  recipient: string;
  occasion: string;
  priceBand?: AssistantBudget;
  interest?: GiftInterest;
  tone?: GiftTone;
};

type FlowLaunchState = {
  origin: string;
  currentProductSlug: string | null;
  scanContext?: AssistantRequest["scanContext"];
};

const ConsultoraBelaPopContext = createContext<ConsultoraBelaPopContextValue | null>(null);

type RoutineTime = "rapida" | "essencial" | "ritual";

const formatMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const routineObjectiveOptions: Array<{ value: RoutineObjective; label: string }> = [
  { value: "hidratação", label: "Hidratação e conforto" },
  { value: "acne", label: "Acne e poros" },
  { value: "manchas", label: "Tom mais uniforme" },
  { value: "oleosidade", label: "Controle de brilho" },
  { value: "sensibilidade", label: "Barreira calma" },
  { value: "glow", label: "Glow saudavel" },
  { value: "antissinais", label: "Textura e firmeza" }
];

const routineSkinTypeOptions: Array<{ value: RoutineSkinType; label: string }> = [
  { value: "oleosa", label: "Oleosa ou brilhando" },
  { value: "seca", label: "Seca ou repuxando" },
  { value: "mista", label: "Mista" },
  { value: "sensível", label: "Sensível ou reativa" },
  { value: "nao_sei", label: "Não sei" }
];

const routineTimeOptions: Array<{ value: RoutineTime; label: string }> = [
  { value: "rapida", label: "Ate 5 minutos" },
  { value: "essencial", label: "10 minutos com constancia" },
  { value: "ritual", label: "Ritual completo" }
];

const budgetOptions: Array<{ value: AssistantBudget; label: string }> = [
  { value: "essencial", label: "Essencial" },
  { value: "intermediaria", label: "Intermediaria" },
  { value: "premium", label: "Premium" }
];

const giftInterestOptions: Array<{ value: GiftInterest; label: string }> = [
  { value: "skincare", label: "Skincare" },
  { value: "maquiagem", label: "Maquiagem" },
  { value: "cabelo", label: "Cabelo" },
  { value: "autocuidado", label: "Autocuidado" }
];

const giftToneOptions: Array<{ value: GiftTone; label: string }> = [
  { value: "seguro", label: "Seguro" },
  { value: "sofisticado", label: "Sofisticado" }
];

const flowButtons: Array<{
  flow: AssistantFlow;
  label: string;
  description: string;
  icon: typeof WandSparkles;
}> = [
  {
    flow: "routine",
    label: brandCtas.primary.buildRoutine,
    description: "Poucas perguntas. Uma recomendação mais certeira.",
    icon: WandSparkles
  },
  {
    flow: "gift",
    label: brandCtas.primary.buildGift,
    description: "Presenteie com cuidado, beleza e intencao.",
    icon: Gift
  },
  {
    flow: "repurchase",
    label: "Recomprar produto",
    description: "Facilidade para manter a rotina com continuidade.",
    icon: Repeat
  },
  {
    flow: "post_scan",
    label: brandCtas.primary.continueAfterScan,
    description: "Complete sua rotina com inteligencia.",
    icon: ScanFace
  }
];

const trustBadges = ["Produtos originais", "Sellers verificados", "Compra segura"];

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAU2BbAbeAwR5Vu09mQLjv0INQ3dKGhvUBcc4k7j91FBWyYf2Nh_x7eKFzKwzEIeHMhRGItg2_LrBVpLY5p5Wmpu72xuexID-FBVP9zl9y-CMTQhkGxyOgGaMcYPMeRYA8uqeIlLlmBTUZNy0BJGadN2Y3rx9ERHNwR8MHZiwkO_0yTkHqvh8fIgzJEGrlQUORnbsGhg-kq9Xo1u2cMDOMH250uY6mwOXRi2IyI044h_7bIyqWL5teoU-2_lDCCvSf2l9fu8VBu14OJ";

const resolveRoutineDepth = (time?: RoutineTime): RoutineDepth =>
  time === "ritual" ? "completa" : "simples";

const resolveRoutineBudget = (time?: RoutineTime): AssistantBudget => {
  if (time === "rapida") return "essencial";
  if (time === "ritual") return "premium";
  return "intermediaria";
};

const resolveRoutineUniverse = (answers: RoutineAnswers) => {
  if (answers.objective === "acne" || answers.objective === "oleosidade") {
    return {
      label: "Acne Care",
      href: "/kits?goal=acne",
      description: "Limpeza leve, tratamento pontual e hidratação que não pesa."
    };
  }

  if (answers.objective === "sensibilidade" || answers.skinType === "sensível") {
    return {
      label: "Barrier Repair",
      href: "/kits?goal=barreira",
      description: "Uma rotina de baixo atrito para conforto, barreira e previsibilidade."
    };
  }

  if (answers.objective === "hidratação" || answers.skinType === "seca") {
    return {
      label: "Hydration Ritual",
      href: "/kits?goal=barreira",
      description: "Camadas de conforto para pele mais macia, luminosa e estavel."
    };
  }

  return {
    label: "Glass Skin",
    href: "/kits?goal=glow",
    description: "Limpeza, tratamento e finalizacao glow com acabamento elegante."
  };
};

const resolveOriginFromPath = (pathname: string | null) => {
  if (!pathname || pathname === "/") return "home";
  if (pathname.startsWith("/produto/")) return "product";
  if (pathname.startsWith("/carrinho")) return "cart";
  if (pathname.startsWith("/rituais")) return "rituais";
  if (pathname.startsWith("/skin-scan")) return "post_scan";
  return "page";
};

const inferCurrentProductSlug = (pathname: string | null) => {
  if (!pathname?.startsWith("/produto/")) return null;
  return pathname.split("/")[2] ?? null;
};

const buildCardList = (response: AssistantRecommendationResponse) => {
  const seen = new Set<string>();
  const collected: AssistantRecommendationCard[] = [];
  const append = (card: AssistantRecommendationCard | null | undefined) => {
    if (!card || seen.has(card.productId)) return;
    seen.add(card.productId);
    collected.push(card);
  };

  response.sections.forEach((section) => append(section.product));
  response.recommendations.forEach(append);
  append(response.primaryProduct);
  append(response.complementaryProduct);

  return collected.slice(0, 5);
};

export function useConsultoraBelaPop() {
  const context = useContext(ConsultoraBelaPopContext);
  if (!context) {
    throw new Error("useConsultoraBelaPop must be used within ConsultoraBelaPopProvider");
  }
  return context;
}

export function ConsultoraBelaPopProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const enabled = isConsultoraBelaPopEnabledPath(pathname);
  const mobileOffset = getConsultoraMobileDockOffset(pathname);
  const { addItem, items, totalShipping } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFlow, setActiveFlow] = useState<AssistantFlow | null>(null);
  const [panel, setPanel] = useState<"start" | "routine" | "gift" | "results">("start");
  const [routineStep, setRoutineStep] = useState(0);
  const [giftStep, setGiftStep] = useState(0);
  const [routineAnswers, setRoutineAnswers] = useState<RoutineAnswers>({});
  const [giftAnswers, setGiftAnswers] = useState<GiftAnswers>({
    recipient: "",
    occasion: ""
  });
  const [response, setResponse] = useState<AssistantRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [launchState, setLaunchState] = useState<FlowLaunchState>({
    origin: "home",
    currentProductSlug: null
  });
  const viewedRecommendationKeys = useRef<Set<string>>(new Set());
  const lastRequestRef = useRef<AssistantRequest | null>(null);

  const runFlow = useCallback(async (flow: AssistantFlow, nextLaunchState = launchState) => {
    const payload: AssistantRequest = {
      flow,
      origin: nextLaunchState.origin,
      currentProductSlug: nextLaunchState.currentProductSlug,
      cartItems: items.map((item) => ({
        productId: item.productId,
        sellerId: item.sellerId,
        quantity: item.quantity
      })),
      shippingTotalCents: totalShipping > 0 ? Math.round(totalShipping * 100) : 0
    };

    if (flow === "routine") {
      payload.routine = {
        objective: routineAnswers.objective ?? "glow",
        skinType: routineAnswers.skinType ?? "nao_sei",
        depth: routineAnswers.depth ?? resolveRoutineDepth(routineAnswers.time),
        budget: routineAnswers.budget ?? resolveRoutineBudget(routineAnswers.time)
      };
    }

    if (flow === "gift") {
      payload.gift = {
        recipient: giftAnswers.recipient.trim() || undefined,
        occasion: giftAnswers.occasion.trim() || undefined,
        priceBand: giftAnswers.priceBand,
        interest: giftAnswers.interest,
        tone: giftAnswers.tone
      };
    }

    if (flow === "post_scan") {
      payload.scanContext = nextLaunchState.scanContext;
    }

    lastRequestRef.current = payload;
    viewedRecommendationKeys.current.clear();
    setActiveFlow(flow);
    setPanel("results");
    setLoading(true);
    setError(null);
    setResponse(null);
    setSuccessMessage(null);

    trackEvent({
      type: "belapop_assistant_flow_started",
      metadata: {
        flow,
        origin: nextLaunchState.origin,
        pathname
      }
    });

    try {
      const fetchResponse = await fetch("/api/assistant/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload)
      });

      const data = (await fetchResponse.json()) as AssistantRecommendationResponse & {
        error?: string;
      };

      if (!fetchResponse.ok) {
        throw new Error("Não foi possível montar a orientação agora.");
      }

      setResponse(data);

      const visibleCards = buildCardList(data);
      visibleCards.forEach((card) => {
        const key = `${data.flow}:${card.productId}:${nextLaunchState.origin}`;
        if (viewedRecommendationKeys.current.has(key)) return;
        viewedRecommendationKeys.current.add(key);
        trackEvent({
          type: "belapop_recommendation_viewed",
          productId: card.productId,
          sellerId: card.sellerId,
          metadata: {
            flow: data.flow,
            origin: nextLaunchState.origin,
            role: card.roleLabel ?? null
          }
        });
      });

      trackEvent({
        type: "belapop_assistant_flow_completed",
        metadata: {
          flow: data.flow,
          origin: nextLaunchState.origin,
          sections: data.sections.length,
          recommendations: visibleCards.length,
          has_kit: Boolean(data.kit),
          empty: Boolean(data.emptyMessage)
        }
      });
    } catch (caughtError) {
      console.error("[ConsultoraBelaPop] flow failed", caughtError);
      setError("Não foi possível carregar a orientação agora.");
    } finally {
      setLoading(false);
    }
  }, [giftAnswers, items, launchState, pathname, routineAnswers, totalShipping]);

  const open = useCallback((detail?: ConsultoraBelaPopOpenDetail) => {
    if (!enabled) return;
    const nextLaunchState: FlowLaunchState = {
      origin: detail?.origin ?? resolveOriginFromPath(pathname),
      currentProductSlug: detail?.currentProductSlug ?? inferCurrentProductSlug(pathname),
      scanContext: detail?.scanContext
    };

    setIsOpen(true);
    setError(null);
    setSuccessMessage(null);
    setResponse(null);
    setRoutineStep(0);
    setGiftStep(0);
    setRoutineAnswers({});
    setGiftAnswers({
      recipient: "",
      occasion: ""
    });
    setLaunchState(nextLaunchState);

    trackEvent({
      type: "belapop_assistant_opened",
      metadata: {
        origin: nextLaunchState.origin,
        pathname,
        requested_flow: detail?.flow ?? null
      }
    });

    if (!detail?.flow) {
      setActiveFlow(null);
      setPanel("start");
      return;
    }

    if (detail.flow === "routine") {
      setActiveFlow("routine");
      setPanel("routine");
      trackEvent({
        type: "belapop_assistant_flow_started",
        metadata: { flow: "routine", origin: nextLaunchState.origin }
      });
      return;
    }

    if (detail.flow === "gift") {
      setActiveFlow("gift");
      setPanel("gift");
      trackEvent({
        type: "belapop_assistant_flow_started",
        metadata: { flow: "gift", origin: nextLaunchState.origin }
      });
      return;
    }

    if (detail.flow === "post_scan") {
      trackEvent({
        type: "belapop_post_scan_recommendation_clicked",
        metadata: { origin: nextLaunchState.origin, pathname }
      });
    }

    void runFlow(detail.flow, nextLaunchState);
  }, [enabled, pathname, runFlow]);

  const beginFlowFromPanel = (flow: AssistantFlow) => {
    if (flow === "routine") {
      setActiveFlow("routine");
      setPanel("routine");
      setRoutineStep(0);
      trackEvent({
        type: "belapop_assistant_flow_started",
        metadata: { flow: "routine", origin: launchState.origin }
      });
      return;
    }

    if (flow === "gift") {
      setActiveFlow("gift");
      setPanel("gift");
      setGiftStep(0);
      trackEvent({
        type: "belapop_assistant_flow_started",
        metadata: { flow: "gift", origin: launchState.origin }
      });
      return;
    }

    if (flow === "post_scan") {
      trackEvent({
        type: "belapop_post_scan_recommendation_clicked",
        metadata: { origin: launchState.origin, pathname }
      });
    }

    void runFlow(flow);
  };

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
      return;
    }

    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<ConsultoraBelaPopOpenDetail>;
      open(customEvent.detail);
    };
    const handleLegacy = () => open();

    window.addEventListener(CONSULTORA_BELAPOP_OPEN_EVENT, handleOpen as EventListener);
    window.addEventListener(LEGACY_CURADORIA_OPEN_EVENT, handleLegacy);

    return () => {
      window.removeEventListener(CONSULTORA_BELAPOP_OPEN_EVENT, handleOpen as EventListener);
      window.removeEventListener(LEGACY_CURADORIA_OPEN_EVENT, handleLegacy);
    };
  }, [enabled, pathname, open]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const contextValue = useMemo<ConsultoraBelaPopContextValue>(
    () => ({
      isOpen,
      open,
      close
    }),
    [isOpen, open, close]
  );

  const handleRetry = async () => {
    if (!lastRequestRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const fetchResponse = await fetch("/api/assistant/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(lastRequestRef.current)
      });
      const data = (await fetchResponse.json()) as AssistantRecommendationResponse & { error?: string };
      if (!fetchResponse.ok) {
        throw new Error("Não foi possível carregar a orientação agora.");
      }
      setResponse(data);
    } catch (caughtError) {
      console.error("[ConsultoraBelaPop] retry failed", caughtError);
      setError("Não foi possível carregar a orientação agora.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (card: AssistantRecommendationCard) => {
    addItem(card.productId, 1, card.sellerId);
    setSuccessMessage("Produto adicionado ao carrinho.");
    trackEvent({
      type: "belapop_recommendation_added_to_cart",
      productId: card.productId,
      sellerId: card.sellerId,
      metadata: {
        flow: activeFlow,
        origin: launchState.origin,
        role: card.roleLabel ?? null
      }
    });
  };

  const handleAddKit = (kit: NonNullable<AssistantRecommendationResponse["kit"]>) => {
    kit.items.forEach((item) => {
      addItem(item.productId, 1, item.sellerId);
    });
    setSuccessMessage("Seleção completa adicionada ao carrinho.");
    trackEvent({
      type: "belapop_kit_added_to_cart",
      metadata: {
        flow: activeFlow,
        origin: launchState.origin,
        kit_name: kit.name,
        items_count: kit.items.length
      }
    });
  };

  const handleRepurchase = async () => {
    if (!response?.repurchaseAction?.orderId) return;
    setLoading(true);
    setError(null);

    try {
      const payload = await postCustomerReorder(response.repurchaseAction.orderId, {
        product_id: response.repurchaseAction.productId ?? undefined
      });

      payload.items.forEach((item) => addItem(item.product_id, item.quantity, item.seller_id));
      setSuccessMessage("Recompra adicionada ao seu carrinho.");
      trackEvent({
        type: "belapop_repurchase_clicked",
        orderId: response.repurchaseAction.orderId,
        metadata: {
          origin: launchState.origin,
          items_count: payload.items.length,
          unavailable_items: payload.unavailable_items.length
        }
      });
      router.push("/carrinho");
      setIsOpen(false);
    } catch (caughtError) {
      console.error("[ConsultoraBelaPop] repurchase failed", caughtError);
      setError("Não foi possível montar a recompra agora.");
    } finally {
      setLoading(false);
    }
  };

  const routineCanAdvance = useMemo(() => {
    if (routineStep === 0) return Boolean(routineAnswers.skinType);
    if (routineStep === 1) return Boolean(routineAnswers.objective);
    return Boolean(routineAnswers.time);
  }, [routineAnswers, routineStep]);

  const giftCanAdvance = useMemo(() => {
    if (giftStep === 0) {
      return giftAnswers.recipient.trim().length > 1 && giftAnswers.occasion.trim().length > 1;
    }
    if (giftStep === 1) return Boolean(giftAnswers.priceBand);
    if (giftStep === 2) return Boolean(giftAnswers.interest);
    return Boolean(giftAnswers.tone);
  }, [giftAnswers, giftStep]);

  const floatingHidden = !enabled || isOpen || pathname === "/" || pathname?.startsWith("/produto/");
  const primaryActionLabel =
    response?.repurchaseAction?.label ?? response?.kit?.ctaLabel ?? null;
  const routineUniverseResult =
    activeFlow === "routine" && routineAnswers.skinType && routineAnswers.objective && routineAnswers.time
      ? resolveRoutineUniverse(routineAnswers)
      : null;

  return (
    <ConsultoraBelaPopContext.Provider value={contextValue}>
      {children}

      {enabled ? (
        <>
          <button
            type="button"
            onClick={() => open()}
            className={`fixed right-4 z-[72] hidden min-h-14 items-center gap-3 rounded-full border border-black/10 bg-[#111111] px-5 text-left text-[#F8F7F4] shadow-[0_18px_48px_rgba(0,0,0,0.24)] transition hover:translate-y-[-1px] tablet:flex ${
              floatingHidden ? "pointer-events-none opacity-0" : "opacity-100"
            } bottom-6`}
            aria-label="Abrir Consultora BelaPop"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7E4858]">
              <MessageCircleMore className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Precisa de ajuda?</span>
              <span className="text-[11px] text-[#E7D8CF]/78">Rotina, presente ou recompra</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => open()}
            className={`fixed left-4 right-4 z-[72] flex min-h-12 items-center justify-between rounded-full border border-black/10 bg-[#111111] px-4 text-[#F8F7F4] shadow-[0_18px_42px_rgba(0,0,0,0.24)] transition tablet:hidden ${
              floatingHidden ? "pointer-events-none opacity-0" : "opacity-100"
            } ${mobileOffset}`}
            aria-label="Abrir Consultora BelaPop"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#7E4858]">
                <MessageCircleMore className="h-4 w-4" />
              </span>
              <span className="flex flex-col text-left">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Precisa de ajuda?</span>
                <span className="text-[10px] text-[#E7D8CF]/76">Rotina, presente ou recompra</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-[#D8C7B6]" />
          </button>

          {isOpen ? (
            <div className="fixed inset-0 z-[90]">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                aria-label="Fechar Consultora BelaPop"
                onClick={close}
              />

              <section className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[28px] border border-black/10 bg-[#FCF9F8] px-5 pb-5 pt-5 shadow-[0_-24px_64px_rgba(0,0,0,0.18)] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[460px] md:rounded-none md:border-l md:border-t-0 md:px-7 md:pb-6 md:pt-6">
                <div className="flex items-start justify-between gap-4 border-b border-black/8 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.34em] text-black/46">BelaPop</p>
                    <h2 className="[font-family:var(--font-playfair)] text-[1.9rem] tracking-[-0.03em] text-black">
                      Consultora BelaPop
                    </h2>
                    <p className="mt-2 text-sm text-black/62">
                      Te ajudo a escolher com mais seguranca.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-black/66"
                    aria-label="Fechar Consultora BelaPop"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 flex-1 overflow-y-auto pb-6">
                  {successMessage ? (
                    <div className="mb-4 rounded-[20px] border border-[#D9C8BF] bg-[#F5ECE6] px-4 py-3 text-sm text-black/72">
                      <p>{successMessage}</p>
                      <button
                        type="button"
                        onClick={() => {
                          router.push("/carrinho");
                          setIsOpen(false);
                        }}
                        className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7E4858]"
                      >
                        Ver carrinho
                      </button>
                    </div>
                  ) : null}

                  {panel === "start" ? (
                    <div className="space-y-5">
                      <div className="rounded-[24px] border border-black/8 bg-white px-4 py-4">
                        <p className="text-sm leading-6 text-black/66">
                          Vamos montar sua rotina ideal em menos de 1 minuto. Escolha com mais
                          seguranca.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {flowButtons.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.flow}
                              type="button"
                              onClick={() => beginFlowFromPanel(item.flow)}
                              className="flex min-h-[84px] items-center justify-between rounded-[22px] border border-black/10 bg-white px-4 py-4 text-left transition hover:border-[#8E5B68] hover:bg-[#FBF4F1]"
                            >
                              <span className="flex min-w-0 items-center gap-4">
                                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-black">
                                    {item.label}
                                  </span>
                                  <span className="mt-1 block text-sm leading-6 text-black/58">
                                    {item.description}
                                  </span>
                                </span>
                              </span>
                              <ArrowRight className="h-4 w-4 shrink-0 text-[#8E5B68]" />
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {trustBadges.map((item) => (
                          <div
                            key={item}
                            className="rounded-full border border-black/8 bg-white px-3 py-2 text-center text-[9px] uppercase tracking-[0.18em] text-black/56"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {panel === "routine" ? (
                    <div className="space-y-5">
                      <FlowProgress
                        currentStep={routineStep}
                        steps={["Pele", "Objetivo", "Tempo"]}
                      />

                      {routineStep === 0 ? (
                        <QuestionBlock
                          eyebrow="Diagnóstico rapido"
                          title="Como esta sua pele hoje?"
                          options={routineSkinTypeOptions}
                          selectedValue={routineAnswers.skinType}
                          onSelect={(value) =>
                            setRoutineAnswers((current) => ({
                              ...current,
                              skinType: value as RoutineSkinType
                            }))
                          }
                        />
                      ) : null}

                      {routineStep === 1 ? (
                        <QuestionBlock
                          eyebrow="Objetivo principal"
                          title="Qual seu principal objetivo?"
                          options={routineObjectiveOptions}
                          selectedValue={routineAnswers.objective}
                          onSelect={(value) =>
                            setRoutineAnswers((current) => ({
                              ...current,
                              objective: value as RoutineObjective
                            }))
                          }
                        />
                      ) : null}

                      {routineStep === 2 ? (
                        <QuestionBlock
                          eyebrow="Ritmo da rotina"
                          title="Quanto tempo você dedica ao skincare?"
                          options={routineTimeOptions}
                          selectedValue={routineAnswers.time}
                          onSelect={(value) =>
                            setRoutineAnswers((current) => ({
                              ...current,
                              time: value as RoutineTime
                            }))
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {panel === "gift" ? (
                    <div className="space-y-5">
                      <FlowProgress
                        currentStep={giftStep}
                        steps={["Contexto", "Faixa", "Interesse", "Tom"]}
                      />

                      {giftStep === 0 ? (
                        <div className="space-y-4">
                          <QuestionIntro
                            eyebrow="Presente com curadoria"
                            title="Para quem e qual a ocasiao?"
                            description="Duas respostas curtas ja deixam a escolha bem mais segura."
                          />
                          <div className="grid gap-3">
                            <TextField
                              label="Para quem e o presente?"
                              placeholder="Ex.: mae, amiga, parceira"
                              value={giftAnswers.recipient}
                              onChange={(value) =>
                                setGiftAnswers((current) => ({ ...current, recipient: value }))
                              }
                            />
                            <TextField
                              label="Qual a ocasiao?"
                              placeholder="Ex.: aniversario, agradecimento, autocuidado"
                              value={giftAnswers.occasion}
                              onChange={(value) =>
                                setGiftAnswers((current) => ({ ...current, occasion: value }))
                              }
                            />
                          </div>
                        </div>
                      ) : null}

                      {giftStep === 1 ? (
                        <QuestionBlock
                          eyebrow="Faixa de preco"
                          title="Qual faixa de preco?"
                          options={budgetOptions}
                          selectedValue={giftAnswers.priceBand}
                          onSelect={(value) =>
                            setGiftAnswers((current) => ({
                              ...current,
                              priceBand: value as AssistantBudget
                            }))
                          }
                        />
                      ) : null}

                      {giftStep === 2 ? (
                        <QuestionBlock
                          eyebrow="Afinidade"
                          title="A pessoa gosta mais de qual universo?"
                          options={giftInterestOptions}
                          selectedValue={giftAnswers.interest}
                          onSelect={(value) =>
                            setGiftAnswers((current) => ({
                              ...current,
                              interest: value as GiftInterest
                            }))
                          }
                        />
                      ) : null}

                      {giftStep === 3 ? (
                        <QuestionBlock
                          eyebrow="Estilo do presente"
                          title="Você prefere algo seguro ou mais sofisticado?"
                          options={giftToneOptions}
                          selectedValue={giftAnswers.tone}
                          onSelect={(value) =>
                            setGiftAnswers((current) => ({
                              ...current,
                              tone: value as GiftTone
                            }))
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {panel === "results" ? (
                    <div className="space-y-5">
                      {loading ? <ConsultoraLoadingState /> : null}

                      {!loading && error ? (
                        <ConsultoraErrorState message={error} onRetry={handleRetry} />
                      ) : null}

                      {!loading && !error && response ? (
                        <>
                          {response.flow === "routine" && routineUniverseResult ? (
                            <section className="rounded-[24px] border border-[#D9C8BF] bg-[#F5ECE6] px-4 py-5">
                              <p className="text-[10px] uppercase tracking-[0.26em] text-[#7E4858]">
                                Seu universo ideal e: {routineUniverseResult.label}
                              </p>
                              <h3 className="[font-family:var(--font-playfair)] mt-2 text-[2rem] leading-[1.02] tracking-[-0.03em] text-black">
                                Rotina sugerida para voce
                              </h3>
                              <p className="mt-3 text-sm leading-6 text-black/62">
                                {routineUniverseResult.description}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  router.push(routineUniverseResult.href);
                                  setIsOpen(false);
                                }}
                                className="mt-5 min-h-12 w-full rounded-full bg-[#111111] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
                              >
                                Ver minha rotina recomendada
                              </button>
                            </section>
                          ) : null}

                          <div className="rounded-[24px] border border-black/8 bg-white px-4 py-4">
                            <p className="text-[10px] uppercase tracking-[0.28em] text-black/46">
                              {response.headline}
                            </p>
                            <h3 className="[font-family:var(--font-playfair)] mt-2 text-[2rem] leading-[1.02] tracking-[-0.03em] text-black">
                              {response.summary}
                            </h3>
                            {response.priority ? (
                              <p className="mt-3 text-sm leading-6 text-black/62">{response.priority}</p>
                            ) : null}
                            {response.freeShippingMessage ? (
                              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7E4858]">
                                {response.freeShippingMessage}
                              </p>
                            ) : null}
                          </div>

                          {response.emptyMessage ? (
                            <ConsultoraEmptyState message={response.emptyMessage} />
                          ) : null}

                          {response.sections.length > 0 ? (
                            <section className="space-y-3">
                              <p className="text-[10px] uppercase tracking-[0.26em] text-black/48">
                                Sua seleção
                              </p>
                              <div className="space-y-3">
                                {response.sections.map((section) =>
                                  section.product ? (
                                    <RecommendationCard
                                      key={`${section.id}-${section.product.productId}`}
                                      card={section.product}
                                      label={section.label}
                                      helper={section.reason}
                                      onAdd={() => handleAddProduct(section.product!)}
                                    />
                                  ) : null
                                )}
                              </div>
                            </section>
                          ) : null}

                          {response.recommendations.length > 0 && response.sections.length === 0 ? (
                            <section className="space-y-3">
                              <p className="text-[10px] uppercase tracking-[0.26em] text-black/48">
                                Recomendações
                              </p>
                              <div className="space-y-3">
                                {response.recommendations.slice(0, 3).map((card) => (
                                  <RecommendationCard
                                    key={card.productId}
                                    card={card}
                                    label={card.roleLabel ?? "Seleção BelaPop"}
                                    helper={card.reason}
                                    onAdd={() => handleAddProduct(card)}
                                  />
                                ))}
                              </div>
                            </section>
                          ) : null}

                          {response.complementaryProduct &&
                          !response.recommendations.some(
                            (card) => card.productId === response.complementaryProduct?.productId
                          ) &&
                          !response.sections.some(
                            (section) => section.product?.productId === response.complementaryProduct?.productId
                          ) ? (
                            <section className="space-y-3">
                              <p className="text-[10px] uppercase tracking-[0.26em] text-black/48">
                                Complemento sugerido
                              </p>
                              <RecommendationCard
                                card={response.complementaryProduct}
                                label={response.complementaryProduct.roleLabel ?? "Complemento"}
                                helper={response.complementaryProduct.reason}
                                onAdd={() => handleAddProduct(response.complementaryProduct!)}
                              />
                            </section>
                          ) : null}

                          {response.kit ? (
                            <section className="rounded-[24px] border border-black/10 bg-[#111111] px-4 py-5 text-[#F8F7F4]">
                              <p className="text-[10px] uppercase tracking-[0.28em] text-[#D8C7B6]">
                                Kit recomendado
                              </p>
                              <h4 className="[font-family:var(--font-playfair)] mt-2 text-[1.8rem] tracking-[-0.03em]">
                                {response.kit.name}
                              </h4>
                              <p className="mt-3 text-sm leading-6 text-[#E7D8CF]/78">
                                {response.kit.benefit}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {response.kit.items.map((item) => (
                                  <span
                                    key={`${response.kit?.name}-${item.productId}`}
                                    className="rounded-full border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#E7D8CF]/80"
                                  >
                                    {item.title}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-5 flex items-end justify-between gap-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#D8C7B6]">
                                    Valor da selecao
                                  </p>
                                  <p className="[font-family:var(--font-playfair)] text-[2rem] tracking-[-0.03em]">
                                    {formatMoney.format(response.kit.totalPriceCents / 100)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddKit(response.kit!)}
                                  className="min-h-12 rounded-full bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black"
                                >
                                  {response.kit.ctaLabel}
                                </button>
                              </div>
                            </section>
                          ) : null}

                          {response.packagingNote ? (
                            <div className="rounded-[22px] border border-[#D9C8BF] bg-[#F5ECE6] px-4 py-4 text-sm leading-6 text-black/68">
                              <p className="text-[10px] uppercase tracking-[0.24em] text-[#7E4858]">
                                Embalagem presenteavel
                              </p>
                              <p className="mt-2">{response.packagingNote}</p>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-black/8 pt-4">
                  {panel === "routine" ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (routineStep === 0) {
                            setPanel("start");
                            setActiveFlow(null);
                            return;
                          }
                          setRoutineStep((current) => Math.max(0, current - 1));
                        }}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-black/70"
                        aria-label="Voltar etapa"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!routineCanAdvance}
                        onClick={() => {
                          if (routineStep < 2) {
                            setRoutineStep((current) => current + 1);
                            return;
                          }
                          void runFlow("routine");
                        }}
                        className="min-h-12 flex-1 rounded-full bg-[#111111] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-40"
                      >
                        {routineStep < 2 ? "Continuar" : "Ver minha rotina recomendada"}
                      </button>
                    </div>
                  ) : null}

                  {panel === "gift" ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (giftStep === 0) {
                            setPanel("start");
                            setActiveFlow(null);
                            return;
                          }
                          setGiftStep((current) => Math.max(0, current - 1));
                        }}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-black/70"
                        aria-label="Voltar etapa"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!giftCanAdvance}
                        onClick={() => {
                          if (giftStep < 3) {
                            setGiftStep((current) => current + 1);
                            return;
                          }
                          void runFlow("gift");
                        }}
                        className="min-h-12 flex-1 rounded-full bg-[#111111] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-40"
                      >
                        {giftStep < 3 ? "Continuar" : "Ver sugestoes"}
                      </button>
                    </div>
                  ) : null}

                  {panel === "results" ? (
                    <div className="space-y-3">
                      {response?.repurchaseAction ? (
                        <button
                          type="button"
                          onClick={handleRepurchase}
                          disabled={loading}
                          className="min-h-12 w-full rounded-full bg-[#111111] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-40"
                        >
                          {loading ? "Montando recompra..." : response.repurchaseAction.label}
                        </button>
                      ) : null}

                      {response?.followUpHref && response?.followUpLabel && response.flow !== "routine" ? (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(response.followUpHref!);
                            setIsOpen(false);
                          }}
                          className={`min-h-12 w-full rounded-full border border-black/10 px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-black ${
                            primaryActionLabel ? "" : "bg-[#111111] text-white"
                          }`}
                        >
                          {response.followUpLabel}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {panel === "start" ? (
                    <div className="flex items-center justify-between gap-3 pt-2 text-[10px] uppercase tracking-[0.18em] text-black/46">
                      <span>Orientacao BelaPop</span>
                      <span>Curadoria rapida</span>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </ConsultoraBelaPopContext.Provider>
  );
}

function FlowProgress({
  currentStep,
  steps
}: {
  currentStep: number;
  steps: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={`h-1 flex-1 rounded-full ${
                index <= currentStep ? "bg-[#8E5B68]" : "bg-black/10"
              }`}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-black/46">
        Etapa {currentStep + 1} de {steps.length}
      </p>
    </div>
  );
}

function QuestionIntro({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.26em] text-black/46">{eyebrow}</p>
      <h3 className="[font-family:var(--font-playfair)] text-[2rem] leading-[1.04] tracking-[-0.03em] text-black">
        {title}
      </h3>
      <p className="text-sm leading-6 text-black/62">{description}</p>
    </div>
  );
}

function QuestionBlock({
  eyebrow,
  title,
  options,
  selectedValue,
  onSelect
}: {
  eyebrow: string;
  title: string;
  options: Array<{ value: string; label: string }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <QuestionIntro
        eyebrow={eyebrow}
        title={title}
        description="Poucas perguntas. Uma recomendação mais certeira."
      />
      <div className="grid gap-3">
        {options.map((option) => {
          const active = option.value === selectedValue;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`min-h-14 rounded-[20px] border px-4 text-left text-sm font-medium uppercase tracking-[0.18em] transition ${
                active
                  ? "border-[#8E5B68] bg-[#FBF4F1] text-black"
                  : "border-black/10 bg-white text-black/70 hover:border-[#8E5B68]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[10px] uppercase tracking-[0.24em] text-black/48">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-14 w-full rounded-[18px] border border-black/10 bg-white px-4 text-sm text-black placeholder:text-black/35 focus:border-[#8E5B68] focus:outline-none"
      />
    </label>
  );
}

function ConsultoraLoadingState() {
  return (
    <div className="rounded-[24px] border border-black/8 bg-white px-4 py-8 text-center">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#8E5B68]" />
      <p className="mt-4 [font-family:var(--font-playfair)] text-[1.8rem] tracking-[-0.03em] text-black">
        Ajustando sua curadoria
      </p>
      <p className="mt-2 text-sm leading-6 text-black/58">
        Estou cruzando objetivo, tags, sellers e faixa de investimento.
      </p>
    </div>
  );
}

function ConsultoraErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[#E6C9C5] bg-[#FFF6F5] px-4 py-5">
      <p className="[font-family:var(--font-playfair)] text-[1.8rem] tracking-[-0.03em] text-black">
        Nao consegui fechar a orientacao agora
      </p>
      <p className="mt-3 text-sm leading-6 text-black/62">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-12 rounded-full bg-[#111111] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function ConsultoraEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-[#D9C8BF] bg-[#F7F0EB] px-4 py-5">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-white">
          <Headset className="h-4 w-4" />
        </div>
        <div>
          <p className="[font-family:var(--font-playfair)] text-[1.6rem] tracking-[-0.03em] text-black">
            Curadoria humana disponivel
          </p>
          <p className="mt-2 text-sm leading-6 text-black/62">{message}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  card,
  label,
  helper,
  onAdd
}: {
  card: AssistantRecommendationCard;
  label: string;
  helper: string;
  onAdd: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-black/10 bg-white">
      <div className="grid grid-cols-[88px_1fr] gap-4 p-4">
        <div className="relative h-[112px] overflow-hidden rounded-[18px] bg-[#F5EFEA]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.imageUrl || fallbackImage}
            alt={card.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#7E4858]">{label}</p>
          <h4 className="[font-family:var(--font-playfair)] mt-2 text-[1.45rem] leading-[1.02] tracking-[-0.03em] text-black">
            {card.title}
          </h4>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-black/50">
            {card.category || "Seleção BelaPop"} • Vendido por {card.sellerName}
          </p>
          <p className="mt-3 text-sm leading-6 text-black/60">{helper}</p>
        </div>
      </div>
      <div className="border-t border-black/8 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/45">Preco</p>
            <p className="[font-family:var(--font-playfair)] text-[1.7rem] tracking-[-0.03em] text-black">
              {formatMoney.format(card.priceCents / 100)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/produto/${card.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-black"
            >
              Ver detalhes
            </Link>
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#111111] px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ConsultoraInlineEntry({
  title,
  description,
  ctaLabel,
  flow,
  origin,
  currentProductSlug,
  scanContext,
  className = "",
  dark = false
}: {
  title: string;
  description: string;
  ctaLabel: string;
  flow?: AssistantFlow;
  origin: string;
  currentProductSlug?: string | null;
  scanContext?: AssistantRequest["scanContext"];
  className?: string;
  dark?: boolean;
}) {
  const { open } = useConsultoraBelaPop();

  return (
    <section
      className={`rounded-[28px] border px-5 py-5 sm:px-6 sm:py-6 ${
        dark
          ? "border-white/10 bg-[#111111] text-[#F8F7F4]"
          : "border-black/10 bg-white text-black"
      } ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p
            className={`text-[10px] uppercase tracking-[0.24em] ${
              dark ? "text-[#D8C7B6]" : "text-[#7E4858]"
            }`}
          >
            Consultora BelaPop
          </p>
          <h3 className="[font-family:var(--font-playfair)] mt-2 text-[2rem] leading-[1.04] tracking-[-0.03em]">
            {title}
          </h3>
          <p className={`mt-3 text-sm leading-6 ${dark ? "text-[#E7D8CF]/78" : "text-black/60"}`}>
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            open({
              flow,
              origin,
              currentProductSlug: currentProductSlug ?? null,
              scanContext
            })
          }
          className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
            dark ? "bg-white text-black" : "bg-[#111111] text-white"
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}

export function ConsultoraFooterShortcut() {
  const pathname = usePathname();

  if (!isConsultoraBelaPopEnabledPath(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() => dispatchConsultoraBelaPopOpen({ origin: "footer_mobile" })}
      className="mt-8 flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-left text-[#F8F7F4] md:hidden"
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7E4858] text-white">
          <MessageCircleMore className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em]">
            Consultora BelaPop
          </span>
          <span className="mt-1 block text-[11px] text-[#E7D8CF]/72">
            Rotina, presente ou recompra
          </span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 text-[#D8C7B6]" />
    </button>
  );
}
