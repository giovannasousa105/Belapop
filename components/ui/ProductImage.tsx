import Image from "next/image";
import type { CSSProperties } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProductImageVariant = "card" | "pdp" | "thumb" | "editorial" | "avatar";

interface ProductImageProps {
  urls:       Record<string, string>;
  alt:        string;
  variante:   ProductImageVariant;
  priority?:  boolean;
  className?: string;
  onClick?:   () => void;
  style?:     CSSProperties;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ASPECT: Record<ProductImageVariant, string> = {
  card:      "1 / 1",
  pdp:       "1 / 1",
  thumb:     "1 / 1",
  editorial: "4 / 3",
  avatar:    "1 / 1",
};

const SIZES: Record<ProductImageVariant, string> = {
  card:      "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  pdp:       "(max-width: 768px) 100vw, 50vw",
  thumb:     "120px",
  editorial: "(max-width: 768px) 100vw, 66vw",
  avatar:    "120px",
};

// Placeholder blur off-white 1×1px — evita flash de branco durante carregamento
const BLUR_PLACEHOLDER =
  "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADwAQCdASoBAAEAAkA4JZQCdAEO/gHOAAA=";

// ─── Fallback sem imagem ──────────────────────────────────────────────────────

function ImageFallback({ variante }: { variante: ProductImageVariant }) {
  const size = variante === "avatar" ? 20 : variante === "thumb" ? 24 : 32;
  return (
    <div
      aria-hidden="true"
      style={{
        width:           "100%",
        height:          "100%",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:      "#F5F2EE",
        color:           "var(--color-text-hint, #9B9B96)",
      }}
    >
      {/* Ícone de imagem neutro — nunca texto "Sem imagem" */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductImage({
  urls,
  alt,
  variante,
  priority = false,
  className,
  onClick,
  style,
}: ProductImageProps) {
  const src = urls[variante] ?? urls["card"] ?? urls["pdp"] ?? null;

  const containerStyle: CSSProperties = {
    aspectRatio:  ASPECT[variante],
    background:   "#FAFAF8",        // off-white — fundo enquanto carrega
    borderRadius: variante === "avatar"
      ? "var(--radius-full, 9999px)"
      : "var(--radius-sm, 4px)",
    overflow:     "hidden",
    position:     "relative",
    cursor:       onClick ? "pointer" : "default",
    // ZERO box-shadow — fundo off-white já cria separação visual
    ...style,
  };

  return (
    <div style={containerStyle} onClick={onClick} className={className}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={SIZES[variante]}
          style={{ objectFit: "contain" }}
          priority={priority}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          unoptimized={src.includes("lh3.googleusercontent.com")}
        />
      ) : (
        <ImageFallback variante={variante} />
      )}
    </div>
  );
}
