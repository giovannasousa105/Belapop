"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Heart,
  Layers3,
  Minus,
  Plus,
  Sparkles,
  Star,
  SunMedium,
  Loader2,
  X,
  ZoomIn
} from "lucide-react";

import { CommerceTrustMarkers } from "@/components/commerce/CommerceTrustMarkers";
import { SaleOriginSummary } from "@/components/commerce/SaleOriginSummary";
import {
  AuthenticityBadge,
  PackagingStandardCard,
  ReturnPolicyCard,
  ShippingInfoCard,
  VerifiedProductBadge
} from "@/components/catalog-standards";
import { ConsultoraInlineEntry } from "@/components/assistant/ConsultoraBelaPop";
import { BundleRecommendationStrip } from "@/components/bundles/BundleRecommendationStrip";
import { ProductShareBar } from "@/components/product/ProductShareBar";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BuyButton } from "@/components/checkout/BuyButton";
import { LoteStatus } from "@/components/lote/LoteStatus";
import { brandCtas } from "@/lib/brand/ctas";
import { brandSectionNames } from "@/lib/brand/sections";
import { useCart } from "@/lib/CartContext";
import { trackViewItem } from "@/lib/analytics";
import { useFavorites } from "@/lib/favorites";
import { useLoteStatus } from "@/lib/hooks/useLoteStatus";
import { liberarReserva } from "@/lib/stripe/reservarLote";
import {
  resolveProductStandardForProduct,
  resolveSellerStandard,
  type ProductSkuStandard,
  type SellerStandardRecord
} from "@/lib/catalog-standards";
import { formatPrice } from "@/lib/utils";
import {
  COMPLEMENTARY_PRODUCTS,
  PRODUCT_DETAILS,
  PRODUCT_NAMES,
} from "@/lib/product-data";
import { BELAPOP_SCAN_KEY } from "@/types/skin-scan";
import type { SkinScanResult } from "@/types/skin-scan";

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes";

type ProductGalleryItem = {
  alt?: string;
  url: string;
};

type ProductPdpPremiumMobileProduct = {
  brand?: string | null;
  category?: string | null;
  coverImage?: string | null;
  description?: string | null;
  gallery?: ProductGalleryItem[] | null;
  hero_image_url?: string | null;
  howToUse?: string[] | null;
  ingredients?: string | null;
  inci?: string | null;
  ritual?: string | null;
  id: string;
  price?: number | null;
  price_cents?: number | null;
  stockQuantity?: number | null;
  stock_quantity?: number | null;
  inStock?: boolean | null;
  sellerId?: string | null;
  sellerName?: string | null;
  sellerStatus?: string | null;
  saleOrigin?: "própria" | "marketplace" | null;
  slug?: string | null;
  title: string;
};

const GALLERY_FALLBACK: ProductGalleryItem[] = [
  { url: "/og-default.jpg", alt: "Imagem do produto." }
];

const LOVE_POINTS = [
  "Hidratação imediata com conforto durante o dia.",
  "Textura leve que encaixa fácil na rotina.",
  "Acabamento luminoso sem pesar na pele."
] as const;

const RECOMMENDATION_POINTS = [
  {
    title: "Alinhado ao seu tipo de pele",
    text: "Fórmula de absorção leve para manter consistência no uso diário."
  },
  {
    title: "Melhora de textura",
    text: "Aplicação uniforme para reduzir aspecto irregular e reforçar maciez."
  },
  {
    title: "Encaixe na sua rotina",
    text: "Uso simples em poucos passos, sem aumentar complexidade."
  }
] as const;

const BENEFITS = [
  { icon: Droplets, label: "Hidratação" },
  { icon: SunMedium, label: "Luminosidade" },
  { icon: Layers3, label: "Textura" },
  { icon: Sparkles, label: "Conforto" }
] as const;

const HOW_TO_USE_FALLBACK = [
  "Aplique sobre a pele limpa e seca.",
  "Distribua em camada uniforme com movimentos suaves.",
  "Finalize com hidratante e protetor solar na rotina diurna."
] as const;


const FAQ_ITEMS = [
  {
    question: "O produto é original?",
    answer: "Sim. Item vendido por parceiro verificado com procedência validada."
  },
  {
    question: "Qual o prazo de entrega?",
    answer: "O prazo é informado no checkout conforme seller e endereço de entrega."
  },
  {
    question: "Posso usar com outros ativos?",
    answer: "Sim. Mantenha camadas leves e ajuste de acordo com resposta da pele."
  },
  {
    question: "Como funciona devolução?",
    answer: "Você pode solicitar devolução pelo fluxo de pedidos dentro da conta."
  }
] as const;

function resolveActiveSection(category: string | null | undefined): HeaderSection {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("maqui")) return "maquiagem";
  if (normalized.includes("cabel")) return "cabelos";
  if (normalized.includes("perf")) return "perfumes";
  return "skincare";
}

function resolveSubtitle(category: string | null | undefined, override?: string | null) {
  if (override) return override;
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("maqui")) return "Cobertura uniforme com acabamento leve.";
  if (normalized.includes("cabel")) return "Tratamento capilar de toque leve e uso diario.";
  if (normalized.includes("perf")) return "Fragrancia de presenca equilibrada para uso diario.";
  return "Tratamento diario com textura leve e acabamento luminoso.";
}

function normalizeUrl(value: string | null | undefined) {
  const clean = value?.trim();
  return clean && clean.length > 0 ? clean : null;
}

function isLegacyPdpPlaceholder(url: string | null | undefined) {
  const normalized = normalizeUrl(url)?.toLowerCase();
  if (!normalized) return true;
  if (normalized === "/logo.svg" || normalized === "/logo-dark.svg") return true;
  if (normalized.includes("/editorial/product-hero-")) return true;
  if (normalized.includes("/editorial/") && normalized.endsWith(".svg")) return true;
  return false;
}

function resolvePrice(product: ProductPdpPremiumMobileProduct) {
  if (typeof product.price === "number" && Number.isFinite(product.price)) return product.price;
  if (typeof product.price_cents === "number" && Number.isFinite(product.price_cents)) {
    return product.price_cents / 100;
  }
  return 0;
}

function resolveStockQuantity(product: ProductPdpPremiumMobileProduct) {
  const raw =
    typeof product.stockQuantity === "number"
      ? product.stockQuantity
      : typeof product.stock_quantity === "number"
        ? product.stock_quantity
        : product.inStock
          ? 1
          : 0;
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
}

function isSellerAvailable(status: string | null | undefined) {
  return status === "active" || status === "approved";
}

function resolveGallery(product: ProductPdpPremiumMobileProduct) {
  const fromProduct: ProductGalleryItem[] = [];

  (product.gallery ?? []).forEach((item) => {
    const url = normalizeUrl(item?.url);
    if (!url || isLegacyPdpPlaceholder(url)) return;
    fromProduct.push({
      url,
      alt: item?.alt?.trim() || `${product.title} - imagem`
    });
  });

  const hero = normalizeUrl(product.hero_image_url);
  if (hero && !isLegacyPdpPlaceholder(hero)) {
    fromProduct.push({ url: hero, alt: `${product.title} - principal` });
  }

  const cover = normalizeUrl(product.coverImage);
  if (cover && !isLegacyPdpPlaceholder(cover)) {
    fromProduct.push({ url: cover, alt: `${product.title} - capa` });
  }

  const dedup = new Map<string, ProductGalleryItem>();
  [...fromProduct, ...GALLERY_FALLBACK].forEach((item) => {
    if (!dedup.has(item.url)) dedup.set(item.url, item);
  });

  const result = Array.from(dedup.values());
  while (result.length < 4) {
    result.push(GALLERY_FALLBACK[result.length % GALLERY_FALLBACK.length]);
  }

  return result.slice(0, 4);
}

// ─── ReviewsBottomSheet ───────────────────────────────────────────────────────

function ReviewsBottomSheet({
  open,
  onClose,
  reviews,
}: {
  open: boolean;
  onClose: () => void;
  reviews: ReadonlyArray<{ author: string; text: string }>;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  // Fecha com swipe down > 80px
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current   = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    const delta = touchCurrentY.current - touchStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    if (delta > 80) onClose();
  }, [onClose]);

  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Avaliações">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="absolute bottom-0 left-0 right-0 flex flex-col overflow-hidden rounded-t-[20px] bg-white transition-transform duration-300"
        style={{ maxHeight: "85dvh" }}
      >
        {/* Handle */}
        <div className="flex shrink-0 flex-col items-center pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-black/20" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-5 pb-4">
          <h2 className="[font-family:var(--font-playfair)] text-xl font-medium text-black">
            Avaliações
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-black/50 hover:bg-black/5"
            aria-label="Fechar avaliações"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista com scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.author} className="rounded-2xl border border-black/10 px-5 py-5">
                <div className="mb-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-black text-black" />
                  ))}
                </div>
                <p className="text-[0.94rem] leading-[1.66] text-black/70">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/55">
                  {review.author}
                </p>
              </article>
            ))}
          </div>
          {/* Espaço para home indicator */}
          <div style={{ height: "env(safe-area-inset-bottom, 16px)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── ProductGalleryLightbox ───────────────────────────────────────────────────

function ProductGalleryLightbox({
  open,
  onClose,
  gallery,
  activeIndex,
  onNavigate,
  title,
}: {
  open: boolean;
  onClose: () => void;
  gallery: ProductGalleryItem[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  title: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((activeIndex + 1) % gallery.length);
      if (e.key === "ArrowLeft") onNavigate((activeIndex - 1 + gallery.length) % gallery.length);
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, onNavigate, activeIndex, gallery.length]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const item = gallery[activeIndex];

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Imagem ampliada do produto">
      <div className="flex items-center justify-between p-4">
        <span className="text-xs uppercase tracking-[0.2em] text-white/60">
          {activeIndex + 1} / {gallery.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar imagem ampliada"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex-1">
        <Image
          src={item?.url || GALLERY_FALLBACK[0].url}
          alt={item?.alt || `${title} - imagem ampliada`}
          fill
          unoptimized
          sizes="100vw"
          className="object-contain"
        />

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate((activeIndex - 1 + gallery.length) % gallery.length)}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate((activeIndex + 1) % gallery.length)}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className="flex justify-center gap-2 p-4">
          {gallery.map((galleryItem, index) => (
            <button
              key={`${galleryItem.url}-lightbox-dot`}
              type="button"
              onClick={() => onNavigate(index)}
              aria-label={`Ir para imagem ${index + 1}`}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className={`block rounded-full transition-all duration-200 ${
                  activeIndex === index ? "h-2 w-7 bg-white" : "h-1.5 w-1.5 bg-white/35"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── GalleryWishlistButton ────────────────────────────────────────────────────

function GalleryWishlistButton({ productSlug }: { productSlug: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const ativa = isFavorite(productSlug);

  return (
    <button
      type="button"
      aria-label={ativa ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={ativa}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(productSlug);
      }}
      className="flex h-11 w-11 items-center justify-center rounded-full"
      style={{ background: "rgba(255,255,255,0.9)" }}
    >
      <Heart
        className="h-[22px] w-[22px]"
        fill={ativa ? "#e11d48" : "none"}
        stroke={ativa ? "#e11d48" : "currentColor"}
        strokeWidth={1.5}
      />
    </button>
  );
}

function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  disabled
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/70">
        Quantidade
      </span>
      <div className="flex items-center border border-black/15">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || quantity <= 1}
          aria-label="Diminuir quantidade"
          className="flex h-11 w-11 items-center justify-center text-black transition hover:bg-black/5 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="flex h-11 min-w-[3rem] items-center justify-center text-[0.95rem] font-medium text-black">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled}
          aria-label="Aumentar quantidade"
          className="flex h-11 w-11 items-center justify-center text-black transition hover:bg-black/5 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function RatingRow({ ratingMedio, totalAvaliacoes }: { ratingMedio: number; totalAvaliacoes: number }) {
  if (totalAvaliacoes < 3) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-black">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/60">
        {ratingMedio.toFixed(1)} ({totalAvaliacoes} avaliações)
      </span>
    </div>
  );
}

function StandardsTrustBlock({
  compact = false,
  productStandard,
  sellerStandard
}: {
  compact?: boolean;
  productStandard: ProductSkuStandard;
  sellerStandard: SellerStandardRecord;
}) {
  const isAuthenticProduct =
    productStandard.authenticity.status === "verified" ||
    productStandard.authenticityStatus === "authentic-belapop";
  const isSellerVerified =
    sellerStandard.status === "approved" ||
    sellerStandard.verificationStatus === "approved" ||
    sellerStandard.verificationStatus === "verified-belapop";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {isAuthenticProduct ? (
          <VerifiedProductBadge type="authentic-product" compact={compact} />
        ) : null}
        {isSellerVerified ? (
          <VerifiedProductBadge type="seller-verified" compact={compact} />
        ) : null}
        {sellerStandard.shippingPolicy.premiumShipping ? (
          <VerifiedProductBadge type="premium-shipping" compact={compact} />
        ) : null}
        {productStandard.authenticity.invoiceAvailable || sellerStandard.invoiceIssuanceConfirmed ? (
          <VerifiedProductBadge type="invoice-guaranteed" compact={compact} />
        ) : null}
        <VerifiedProductBadge type="belapop-curation" compact={compact} />
      </div>

      <AuthenticityBadge authenticity={productStandard.authenticity} compact={compact} />

      <div className="grid gap-3 xl:grid-cols-3">
        <ShippingInfoCard policy={sellerStandard.shippingPolicy} compact={compact} />
        <ReturnPolicyCard policy={sellerStandard.returnPolicy} compact={compact} />
        <PackagingStandardCard packaging={productStandard.packaging} compact={compact} />
      </div>
    </div>
  );
}

export function ProductPdpPremiumMobile({
  product,
  productStandard: providedProductStandard,
  sellerStandard: providedSellerStandard,
  ratingMedio = 0,
  totalAvaliacoes = 0,
}: {
  product: ProductPdpPremiumMobileProduct;
  productStandard?: ProductSkuStandard;
  sellerStandard?: SellerStandardRecord;
  ratingMedio?: number;
  totalAvaliacoes?: number;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const gallery = useMemo(() => resolveGallery(product), [product]);
  const price = resolvePrice(product);
  const installment = price > 0 ? formatPrice(price / 6) : "R$ 0,00";
  const sellerId = product.sellerId || "unknown";
  const stockQuantity = resolveStockQuantity(product);
  const sellerCanSell = isSellerAvailable(product.sellerStatus);
  const isPurchasable = price > 0 && stockQuantity > 0 && sellerCanSell;
  const availabilityCopy = isPurchasable
    ? stockQuantity > 5
      ? "Em estoque"
      : `Ultimas ${stockQuantity} unidades`
    : "Indisponível no momento";
  const activeSection = resolveActiveSection(product.category);
  const howToUse = product.howToUse?.length ? product.howToUse.slice(0, 3) : HOW_TO_USE_FALLBACK;
  const productStandard = useMemo(
    () => providedProductStandard ?? resolveProductStandardForProduct(product),
    [product, providedProductStandard]
  );
  const sellerStandard = useMemo(
    () => providedSellerStandard ?? resolveSellerStandard(productStandard.sellerId),
    [productStandard.sellerId, providedSellerStandard]
  );

  const productDetails = PRODUCT_DETAILS[product.slug ?? ""] ?? null;
  const complementarySlugs = COMPLEMENTARY_PRODUCTS[(product.category ?? "").toLowerCase()] ?? [];
  const activeLovePoints: string[] = productDetails
    ? productDetails.ativos.slice(0, 3).map((a) => a.funcao)
    : Array.from(LOVE_POINTS);

  const { config: loteConfig } = useLoteStatus(product.id);
  const [loteEncerrado, setLoteEncerrado] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [compatScore, setCompatScore] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<"cart" | "checkout" | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [reviewsSheetOpen, setReviewsSheetOpen] = useState(false);
  const [fixedCtaVisible, setFixedCtaVisible] = useState(false);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);
  const mainCtaRef = useRef<HTMLDivElement | null>(null);
  const kitCta = productDetails?.customCta ?? null;
  const addToCartLabel = !isPurchasable
    ? "Indisponível"
    : pendingAction === "cart"
      ? "Adicionando..."
      : (kitCta ?? brandCtas.primary.addToCart);
  const buyNowLabel = !isPurchasable
    ? "Indisponível"
    : pendingAction === "checkout"
      ? "Redirecionando..."
      : brandCtas.primary.buyNow;

  useEffect(() => {
    if (activeImageIndex > gallery.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, gallery.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gallery.forEach((item) => {
      const preload = new window.Image();
      preload.src = item.url;
    });
  }, [gallery]);

  useEffect(() => {
    trackViewItem({
      item_id: product.id,
      item_name: product.title,
      item_category: product.category ?? undefined,
      price
    });
  }, [product.id, product.title, product.category, price]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BELAPOP_SCAN_KEY) ?? sessionStorage.getItem("BELAPOP_SCAN_KEY");
      if (!raw) return;
      const parsed = JSON.parse(raw) as SkinScanResult;
      const s = parsed.analise?.scores;
      if (!s) return;
      const score = Math.round((s.hidratacao + s.uniformidade + s.textura + s.luminosidade) / 4);
      setCompatScore(Math.min(100, Math.max(0, score)));
    } catch {
      // sessionStorage pode estar indisponível
    }
  }, []);

  // Release reservation immediately when Stripe redirects back after cancellation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reservaId = params.get("reserva_id");
    const loteId = params.get("lote_id");
    if (params.get("checkout") === "cancelado" && reservaId && loteId) {
      liberarReserva(loteId, reservaId);
      params.delete("reserva_id");
      params.delete("lote_id");
      params.delete("checkout");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  // CTA fixo: visível apenas quando o CTA principal sai do viewport
  useEffect(() => {
    const target = mainCtaRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFixedCtaVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const onTrackScroll = (event: UIEvent<HTMLDivElement>) => {
    const width = event.currentTarget.clientWidth;
    if (width <= 0) return;
    const index = Math.round(event.currentTarget.scrollLeft / width);
    if (index !== activeImageIndex) {
      setActiveImageIndex(Math.max(0, Math.min(index, gallery.length - 1)));
    }
  };

  const scrollToImage = (index: number) => {
    setActiveImageIndex(index);
    if (!mobileTrackRef.current) return;
    mobileTrackRef.current.scrollTo({
      left: mobileTrackRef.current.clientWidth * index,
      behavior: "smooth"
    });
  };

  const handleBuyAction = (target: "cart" | "checkout") => {
    if (pendingAction || !isPurchasable) return;
    setPendingAction(target);
    addItem(product.id, quantity, sellerId, {
      name: product.title,
      price,
      category: product.category ?? undefined
    });
    router.push(target === "cart" ? "/carrinho" : "/checkout");
  };

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () =>
    setQuantity((q) => (stockQuantity > 0 ? Math.min(stockQuantity, q + 1) : q + 1));

  return (
    <div
      className="min-h-screen bg-[#fcf9f8] [font-family:var(--font-inter)] tracking-[0.002em] text-[#1c1b1b]"
      data-belapop-page="pdp-premium-mobile"
    >
      <BelaPopValidatedHeader activeSection={activeSection} />

      <main
        className="pt-[78px] md:pb-0 lg:pt-[86px]"
        style={{ paddingBottom: "calc(200px + env(safe-area-inset-bottom, 0px))" }}
      >
        <section className="bg-[#f8f3ee]">
          <div className="md:hidden">
            <div className="relative h-[42svh] min-h-[340px] max-h-[430px] w-full overflow-hidden">
              <div
                ref={mobileTrackRef}
                onScroll={onTrackScroll}
                className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {gallery.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="relative h-full min-w-full snap-start">
                    <Image
                      src={item.url}
                      alt={item.alt || `${product.title} - imagem ${index + 1}`}
                      fill
                      unoptimized
                      sizes="100vw"
                      priority={index === 0}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* WishlistButton: canto superior direito — touch target 44×44px */}
              <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                <GalleryWishlistButton productSlug={product.slug ?? product.id} />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Ampliar imagem"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-black shadow-sm backdrop-blur"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>

              {/* Dots: área clicável 44×44px, indicador visual menor */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-0.5">
                {gallery.map((item, index) => (
                  <button
                    key={`${item.url}-dot`}
                    type="button"
                    onClick={() => scrollToImage(index)}
                    aria-label={`Ir para imagem ${index + 1}`}
                    className="flex h-11 w-11 items-center justify-center"
                  >
                    <span
                      className={`block rounded-full transition-all duration-200 ${
                        activeImageIndex === index
                          ? "h-2 w-7 bg-black"
                          : "h-1.5 w-1.5 bg-black/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-9">
              <div className="space-y-7">
                <RatingRow ratingMedio={ratingMedio} totalAvaliacoes={totalAvaliacoes} />

                <div className="space-y-2.5">
                  <h1 className="[font-family:var(--font-playfair)] text-[1.65rem] font-medium leading-[1.02] tracking-[-0.018em] text-black">
                    {product.title}
                  </h1>
                  <p className="text-[0.9rem] font-normal leading-[1.62] text-black/62">
                    {resolveSubtitle(product.category, productDetails?.subtitulo)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="[font-family:var(--font-playfair)] text-[2.2rem] font-semibold leading-[0.95] tracking-[-0.016em] text-black">
                    {formatPrice(price)}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-black/54">
                    Em até 6x de {installment} sem juros
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-black/58">
                    {availabilityCopy}
                  </p>
                </div>

                {isPurchasable ? (
                  <QuantitySelector
                    quantity={quantity}
                    onDecrease={decreaseQuantity}
                    onIncrease={increaseQuantity}
                    disabled={pendingAction !== null}
                  />
                ) : null}

                {/* ref para IntersectionObserver — CTA fixo some quando este está visível */}
                <div ref={mainCtaRef} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleBuyAction("cart")}
                    disabled={pendingAction !== null || !isPurchasable}
                    className="min-h-14 w-full bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/90 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {pendingAction === "cart" ? <Loader2 size={13} className="animate-spin" /> : null}
                      {addToCartLabel}
                    </span>
                  </button>
                  {loteConfig ? (
                    <>
                      <LoteStatus
                        produto_id={product.id}
                        variante="pdp"
                        onLoteEncerrado={() => setLoteEncerrado(true)}
                      />
                      <BuyButton
                        lote_id={loteConfig.lote_id}
                        produto_id={product.id}
                        quantidade={quantity}
                        disabled={loteEncerrado || !isPurchasable}
                        className="min-h-14 w-full border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyAction("checkout")}
                      disabled={pendingAction !== null || !isPurchasable}
                      className="min-h-14 w-full border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {pendingAction === "checkout" ? <Loader2 size={13} className="animate-spin" /> : null}
                        {buyNowLabel}
                      </span>
                    </button>
                  )}
                </div>

                <SaleOriginSummary
                  compact
                  sellerName={product.sellerName}
                  sellerStatus={product.sellerStatus}
                  saleOrigin={product.saleOrigin}
                />

                <StandardsTrustBlock
                  compact
                  productStandard={productStandard}
                  sellerStandard={sellerStandard}
                />

                <CommerceTrustMarkers compact />

                <ConsultoraInlineEntry
                  flow="routine"
                  origin="pdp_inline"
                  currentProductSlug={product.slug}
                  title="Escolha com mais segurança"
                  description="Se quiser, eu encaixo este produto em uma rotina simples ou completa e ainda sugiro um complemento coerente."
                  ctaLabel="Receber orientação"
                />

                {/* Descrição expansível — máx 3 linhas por padrão */}
                {product.description ? (
                  <div className="space-y-2 border-t border-black/10 pt-5">
                    <p
                      className={`text-[0.94rem] leading-[1.66] text-black/70 ${
                        descExpanded ? "" : "line-clamp-3"
                      }`}
                    >
                      {product.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="min-h-[44px] text-[11px] font-semibold uppercase tracking-[0.14em] text-black underline-offset-2 hover:underline"
                    >
                      {descExpanded ? "Ler menos" : "Ler mais"}
                    </button>
                  </div>
                ) : null}

                <div className="space-y-3.5 border-t border-black/10 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/70">
                    {brandSectionNames.product.whySelected}
                  </p>
                  <ul className="space-y-2">
                    {activeLovePoints.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[0.94rem] leading-[1.66] text-black/72">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <ProductShareBar title={product.title} />
              </div>
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1440px] grid-cols-[58%_42%] md:grid">
            <div className="bg-[#f2ebe5] px-10 py-10 lg:px-16 lg:py-14">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
                <Image
                  src={gallery[activeImageIndex]?.url || GALLERY_FALLBACK[0].url}
                  alt={gallery[activeImageIndex]?.alt || `${product.title} - principal`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                  priority
                />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Ampliar imagem"
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-black shadow-sm backdrop-blur"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((item, index) => (
                  <button
                    key={`${item.url}-thumb`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-24 w-24 shrink-0 overflow-hidden border ${
                      activeImageIndex === index
                        ? "border-black"
                        : "border-black/10 transition hover:border-black/35"
                    }`}
                    aria-label={`Selecionar imagem ${index + 1}`}
                  >
                    <Image
                      src={item.url}
                      alt={item.alt || `${product.title} - miniatura ${index + 1}`}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#fcf9f8] px-10 py-10 lg:px-14 lg:py-14">
              <div className="space-y-7">
                <RatingRow ratingMedio={ratingMedio} totalAvaliacoes={totalAvaliacoes} />

                <div className="space-y-2.5">
                  <h1 className="[font-family:var(--font-playfair)] text-[3.05rem] font-medium leading-[0.98] tracking-[-0.022em] text-black">
                    {product.title}
                  </h1>
                  <p className="text-[0.95rem] font-normal leading-[1.62] text-black/62">
                    {resolveSubtitle(product.category, productDetails?.subtitulo)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="[font-family:var(--font-playfair)] text-[3.35rem] font-semibold leading-[0.94] tracking-[-0.018em] text-black">
                    {formatPrice(price)}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-black/54">
                    Em até 6x de {installment} sem juros
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-black/58">
                    {availabilityCopy}
                  </p>
                </div>

                {isPurchasable ? (
                  <QuantitySelector
                    quantity={quantity}
                    onDecrease={decreaseQuantity}
                    onIncrease={increaseQuantity}
                    disabled={pendingAction !== null}
                  />
                ) : null}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleBuyAction("cart")}
                    disabled={pendingAction !== null || !isPurchasable}
                    className="min-h-14 w-full bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/90 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {pendingAction === "cart" ? <Loader2 size={13} className="animate-spin" /> : null}
                      {addToCartLabel}
                    </span>
                  </button>
                  {loteConfig ? (
                    <>
                      <LoteStatus
                        produto_id={product.id}
                        variante="pdp"
                        onLoteEncerrado={() => setLoteEncerrado(true)}
                      />
                      <BuyButton
                        lote_id={loteConfig.lote_id}
                        produto_id={product.id}
                        quantidade={quantity}
                        disabled={loteEncerrado || !isPurchasable}
                        className="min-h-14 w-full border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyAction("checkout")}
                      disabled={pendingAction !== null || !isPurchasable}
                      className="min-h-14 w-full border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {pendingAction === "checkout" ? <Loader2 size={13} className="animate-spin" /> : null}
                        {buyNowLabel}
                      </span>
                    </button>
                  )}
                </div>

                <SaleOriginSummary
                  compact
                  sellerName={product.sellerName}
                  sellerStatus={product.sellerStatus}
                  saleOrigin={product.saleOrigin}
                />

                <StandardsTrustBlock
                  productStandard={productStandard}
                  sellerStandard={sellerStandard}
                />

                <CommerceTrustMarkers compact />

                <ConsultoraInlineEntry
                  flow="routine"
                  origin="pdp_inline"
                  currentProductSlug={product.slug}
                  title="Complete a rotina com inteligência"
                  description="Eu uso este item como ponto de partida para sugerir os próximos passos com mais coerência e menos excesso."
                  ctaLabel="Receber orientação"
                />

                <div className="space-y-3.5 border-t border-black/10 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/70">
                    {brandSectionNames.product.whySelected}
                  </p>
                  <ul className="space-y-2">
                    {activeLovePoints.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[0.94rem] leading-[1.66] text-black/72">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <ProductShareBar title={product.title} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1280px] space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                  Recomendação
                </p>
                <h2 className="mt-2 [font-family:var(--font-playfair)] text-[2.05rem] font-medium leading-[1.07] tracking-[-0.015em] text-black sm:text-[2.45rem]">
                  {brandSectionNames.product.forWho}
                </h2>
                <p className="mt-3 text-[0.95rem] leading-[1.62] text-black/64">
                  Análise de contexto para uma rotina com aplicação simples e consistente.
                </p>
              </div>
              {compatScore !== null ? (
                <div className="inline-flex items-end gap-2 border-b border-black/15 pb-1">
                  <span className="[font-family:var(--font-playfair)] text-[3.2rem] font-semibold leading-none tracking-[-0.014em] text-black">
                    {compatScore}%
                  </span>
                  <span className="pb-1 text-[10px] uppercase tracking-[0.2em] text-black/55">
                    Compatibilidade
                  </span>
                </div>
              ) : (
                <Link
                  href="/skin-scan"
                  className="inline-flex flex-col items-center gap-1 border-b border-black/15 pb-2 text-center transition hover:border-black/40"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">
                    Compatibilidade
                  </span>
                  <span className="text-[11px] font-medium text-[#C17A90] underline underline-offset-2">
                    Descobrir minha compatibilidade →
                  </span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {RECOMMENDATION_POINTS.map((item) => (
                <article key={item.title} className="rounded-2xl border border-black/10 bg-white px-5 py-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[0.94rem] leading-[1.62] text-black/70">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1eb] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="[font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
              Beneficios
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {BENEFITS.map((item) => (
                <article key={item.label} className="rounded-2xl bg-white px-4 py-5 text-center">
                  <item.icon className="mx-auto h-6 w-6 text-black/75" />
                  <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
                    {item.label}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        {productDetails?.kitItems?.length ? (
          <section className="bg-white px-5 py-14 md:px-8 md:py-20">
            <div className="mx-auto max-w-[980px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                O que vem no kit
              </p>
              <h2 className="mt-2 [font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
                5 produtos. 1 rotina completa.
              </h2>
              <ol className="mt-8 space-y-4">
                {productDetails.kitItems.map((item, i) => (
                  <li
                    key={item.nome}
                    className="flex gap-5 rounded-2xl border border-black/8 bg-[#fcf9f8] p-5"
                  >
                    <p
                      aria-hidden="true"
                      className="shrink-0 [font-family:var(--font-playfair)] text-4xl font-medium leading-none text-black/15"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c08fa3]">
                        {item.passo}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-black/80">
                        {item.marca} · {item.nome}
                      </p>
                      <p className="mt-1.5 text-[0.88rem] leading-[1.6] text-black/58">
                        {item.descricao}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[980px]">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h2 className="[font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
                {brandSectionNames.product.howToUse}
              </h2>
              {product.ritual ? (
                <span className="border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/60">
                  {product.ritual}
                </span>
              ) : null}
            </div>
            {productDetails?.comoUsar?.length ? (
              <div className="space-y-8">
                {productDetails.comoUsar.map((uso, ui) => (
                  <div key={ui}>
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/50">
                      {uso.periodo}
                    </p>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {uso.passos.map((passo, pi) => (
                        <article key={pi} className="flex items-start gap-4">
                          <p className="[font-family:var(--font-playfair)] text-4xl font-medium leading-none tracking-[-0.012em] text-black/20">
                            {`0${pi + 1}`}
                          </p>
                          <p className="pt-1 text-[0.94rem] leading-[1.62] text-black/70">{passo}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {howToUse.map((step, index) => (
                  <article key={step} className="text-center">
                    <p className="[font-family:var(--font-playfair)] text-5xl font-medium leading-none tracking-[-0.012em] text-black/20">{`0${index + 1}`}</p>
                    <p className="mt-3 text-[0.94rem] leading-[1.62] text-black/70">{step}</p>
                  </article>
                ))}
              </div>
            )}
            <p className="mt-10 text-center">
              <Link
                href="/kits"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4 text-black/60 hover:text-black"
              >
                Ver kits que incluem este tipo de produto →
              </Link>
            </p>
          </div>
        </section>

        {(product.ingredients || product.inci) ? (
          <section className="bg-white px-5 py-14 md:px-8 md:py-20">
            <div className="mx-auto max-w-[980px]">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <h2 className="[font-family:var(--font-playfair)] text-[1.6rem] font-medium tracking-[-0.012em] text-black sm:text-[2rem]">
                    Ingredientes
                  </h2>
                  <ChevronDown className="h-5 w-5 shrink-0 text-black/50 transition-transform [[open]_&]:rotate-180" />
                </summary>
                <div className="mt-6 space-y-4">
                  {product.ingredients ? (
                    <p className="text-[0.9rem] leading-[1.7] text-black/70">{product.ingredients}</p>
                  ) : null}
                  {product.inci ? (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Lista INCI</p>
                      <p className="text-[11px] leading-[1.8] tracking-[0.02em] text-black/50">{product.inci}</p>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          </section>
        ) : null}

        {productDetails && (
          <section className="bg-[#f6f1eb] px-5 py-14 md:px-8 md:py-20">
            <div className="mx-auto max-w-[980px] space-y-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                  Formulação
                </p>
                <h2 className="mt-2 [font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
                  Ativos e Evidências
                </h2>
              </div>
              <div className="space-y-3">
                {productDetails.ativos.map((ativo) => (
                  <div
                    key={ativo.nome}
                    className="rounded-2xl border border-black/10 bg-white px-5 py-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[0.94rem] font-medium text-black">{ativo.nome}</span>
                      <span className="shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60">
                        {ativo.concentracao}
                      </span>
                    </div>
                    <p className="mt-2 text-[0.9rem] leading-[1.62] text-black/65">{ativo.funcao}</p>
                    <p className="mt-1.5 text-[10px] tracking-[0.06em] text-black/35">{ativo.referencia}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {productDetails && (
          <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
            <div className="mx-auto max-w-[980px] space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                    Indicado para
                  </p>
                  <ul className="space-y-2">
                    {productDetails.indicadoPara.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[0.94rem] leading-[1.62] text-black/70"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                    Atenção
                  </p>
                  <ul className="space-y-2">
                    {productDetails.naoIndicadoPara.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[0.9rem] leading-[1.62] text-black/60"
                      >
                        <span className="mt-0.5 shrink-0 text-xs font-bold text-amber-600">!</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-black/10 pt-6">
                {productDetails.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium tracking-[0.06em] text-black/55"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-y border-black/10 bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="[font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
              Avaliações
            </h2>
            <div className="mt-8 rounded-2xl border border-black/10 bg-white px-6 py-8 text-center">
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-black/20" />
                ))}
              </div>
              <p className="mt-4 [font-family:var(--font-playfair)] text-xl font-medium text-black">
                Seja o primeiro a avaliar
              </p>
              <p className="mt-2 text-sm leading-7 text-black/55">
                Comprou este produto? Compartilhe sua experiência com outros clientes.
              </p>
              <Link
                href="/conta/pedidos"
                className="mt-5 inline-flex min-h-11 items-center justify-center border border-black px-5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
              >
                Avaliar após a compra
              </Link>
            </div>
          </div>
        </section>

        <BundleRecommendationStrip
          title="Combine com kits BelaPop"
          subtitle="Complete sua rotina com kits curados que incluem produtos como este."
          limit={3}
          className="bg-[#f6f1eb]"
        />

        {complementarySlugs.length > 0 && (
          <section className="bg-white px-5 py-14 md:px-8 md:py-20">
            <div className="mx-auto max-w-[980px] space-y-6">
              <h2 className="[font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
                Completa sua Rotina
              </h2>
              <div className="space-y-3">
                {complementarySlugs.map((slug) => {
                  const pd = PRODUCT_DETAILS[slug];
                  const name = PRODUCT_NAMES[slug] ?? slug;
                  if (!pd) return null;
                  const icon =
                    pd.categoria === "Limpeza" ? "🫧"
                    : pd.categoria === "Tonico" ? "💧"
                    : pd.categoria === "Serum" ? "✨"
                    : pd.categoria === "Hidratante" ? "🌿"
                    : pd.categoria === "Proteção Solar" ? "☀️"
                    : pd.categoria === "Olhos" ? "◉"
                    : "◈";
                  return (
                    <Link
                      key={slug}
                      href={`/produto/${slug}`}
                      className="flex items-center gap-4 rounded-2xl border border-black/10 bg-[#fcf9f8] p-4 transition hover:border-black/30"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.94rem] font-medium text-black">{name}</p>
                        <p className="text-xs text-black/55">{pd.subtitulo}</p>
                      </div>
                      <span className="text-black/30">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {productDetails?.cienciaSemHype ? (
          <section className="bg-white px-5 py-14 md:px-8 md:py-20">
            <div className="mx-auto max-w-[980px]">
              <div className="rounded-2xl border border-black/8 bg-[#f6f1eb] p-8 md:p-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">
                  A ciência, sem hype
                </p>
                <p className="mt-4 text-[0.94rem] leading-[1.75] text-black/65">
                  {productDetails.cienciaSemHype}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-[#f6f1eb] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[920px]">
            <h2 className="text-center [font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
              Perguntas frequentes
            </h2>
            <div className="mt-8 space-y-3">
              {(productDetails?.faqItems ?? FAQ_ITEMS).map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-black/10 bg-white px-5 py-4"
                >
                  <summary className="flex list-none items-center justify-between gap-4 text-left">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/75">
                      {item.question}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-black/55 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pt-3 text-[0.94rem] leading-[1.62] text-black/68">{item.answer}</p>
                </details>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-black/55">
              Mais detalhes na{" "}
              <Link href="/politica-de-cookies" className="underline underline-offset-4">
                politica da plataforma
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />

      <ReviewsBottomSheet
        open={reviewsSheetOpen}
        onClose={() => setReviewsSheetOpen(false)}
        reviews={[]}
      />

      <ProductGalleryLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        gallery={gallery}
        activeIndex={activeImageIndex}
        onNavigate={setActiveImageIndex}
        title={product.title}
      />

      {/* CTA fixo: visível apenas quando CTA principal sair do viewport */}
      <div
        aria-hidden={!fixedCtaVisible}
        className={`fixed inset-x-0 bottom-[84px] z-50 border-t border-black/10 bg-[#fcf9f8]/95 px-4 backdrop-blur transition-[opacity,transform] duration-200 md:hidden ${
          fixedCtaVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
        style={{
          paddingTop: "12px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-[96px]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/55">Total</p>
            <p className="[font-family:var(--font-playfair)] text-xl font-semibold leading-none tracking-[-0.012em] text-black">
              {formatPrice(price)}
            </p>
          </div>
          <button
            type="button"
            tabIndex={fixedCtaVisible ? 0 : -1}
            onClick={() => handleBuyAction("cart")}
            disabled={pendingAction !== null || !isPurchasable}
            className="min-h-[52px] flex-1 bg-black px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {pendingAction === "cart" ? <Loader2 size={13} className="animate-spin" /> : null}
              {addToCartLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
