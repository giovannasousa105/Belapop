import { ImageResponse } from "next/og";

export const runtime = "edge";

const CACHE_MAX_AGE = 60 * 60 * 24 * 7;

const CATEGORY_COLORS: Record<string, string> = {
  limpeza: "#EEF4FF",
  tonico: "#FFF0F5",
  serum: "#FFFBEB",
  hidratante: "#F0FDF4",
  proteção: "#FEFCE8",
  olhos: "#FAF5FF",
  cabelos: "#FFF7ED",
  maquiagem: "#FFF1F2",
};

const CATEGORY_ICONS: Record<string, string> = {
  limpeza: "🫧",
  tonico: "💧",
  serum: "✨",
  hidratante: "🌿",
  proteção: "☀️",
  olhos: "👁️",
  cabelos: "💇",
  maquiagem: "💄",
};

function normalizeCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nome = searchParams.get("nome") || "Produto BelaPop";
  const subtitulo = searchParams.get("subtitulo") || "Skincare curado";
  const categoria = normalizeCategory(searchParams.get("categoria") || "serum");
  const preco = searchParams.get("preco") || "";
  const bgColor = CATEGORY_COLORS[categoria] || "#FAFAFA";
  const icon = CATEGORY_ICONS[categoria] || "✦";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: bgColor,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              letterSpacing: "0.2em",
              color: "#8B5E3C",
              fontFamily: "sans-serif",
              fontWeight: 700,
            }}
          >
            BELAPOP
          </span>
          <span
            style={{
              fontSize: "16px",
              color: "#6B7280",
              fontFamily: "sans-serif",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {icon} {categoria}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              lineHeight: 1.08,
              maxWidth: "900px",
            }}
          >
            {nome.length > 56 ? `${nome.slice(0, 53)}...` : nome}
          </p>
          <p
            style={{
              fontSize: "24px",
              color: "#6B7280",
              margin: 0,
              fontFamily: "sans-serif",
              maxWidth: "780px",
              lineHeight: 1.35,
            }}
          >
            {subtitulo}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {preco ? (
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#111827",
                fontFamily: "sans-serif",
              }}
            >
              {preco}
            </span>
          ) : (
            <span />
          )}
          <span
            style={{
              padding: "8px 20px",
              background: "#111827",
              color: "white",
              borderRadius: "100px",
              fontSize: "13px",
              letterSpacing: "0.15em",
              fontFamily: "sans-serif",
            }}
          >
            belapopoficial.com.br
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
      },
    },
  );
}
