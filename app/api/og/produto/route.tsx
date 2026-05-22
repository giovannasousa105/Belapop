import { ImageResponse } from "next/og";

export const runtime = "edge";

const CACHE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const nome   = searchParams.get("nome")   ?? "Produto BelaPop";
  const preco  = searchParams.get("preco")  ?? "";
  const imagem = searchParams.get("imagem") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width:       "100%",
          height:      "100%",
          display:     "flex",
          background:  "#FAF8F5",
          fontFamily:  "sans-serif",
          padding:     48,
          alignItems:  "center",
        }}
      >
        {/* Imagem do produto */}
        {imagem ? (
          <div
            style={{
              width:           500,
              height:          534,
              background:      "#F5F2EE",
              borderRadius:    4,
              overflow:        "hidden",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              marginRight:     48,
              flexShrink:      0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagem}
              alt={nome}
              style={{
                width:      "80%",
                height:     "80%",
                objectFit:  "contain",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width:           500,
              height:          534,
              background:      "#EDE9E3",
              borderRadius:    4,
              marginRight:     48,
              flexShrink:      0,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <span style={{ fontSize: 48, color: "#9B9B96" }}>✦</span>
          </div>
        )}

        {/* Texto */}
        <div
          style={{
            display:        "flex",
            flexDirection:  "column",
            justifyContent: "center",
            flex:           1,
            overflow:       "hidden",
          }}
        >
          {/* Label */}
          <p
            style={{
              fontSize:       12,
              letterSpacing:  "0.12em",
              textTransform:  "uppercase",
              color:          "#9B9B96",
              margin:         "0 0 16px",
            }}
          >
            BelaPop · Curadoria
          </p>

          {/* Nome */}
          <h1
            style={{
              fontSize:     38,
              fontWeight:   400,
              color:        "#111110",
              margin:       "0 0 28px",
              lineHeight:   1.25,
              wordBreak:    "break-word",
            }}
          >
            {nome.length > 60 ? `${nome.slice(0, 57)}…` : nome}
          </h1>

          {/* Preço */}
          {preco && (
            <p
              style={{
                fontSize:   28,
                fontWeight: 400,
                color:      "#111110",
                margin:     "0 0 12px",
              }}
            >
              R$ {preco}
            </p>
          )}

          {/* Separator */}
          <div
            style={{
              width:      60,
              height:     1,
              background: "#D4D3CE",
              margin:     "12px 0",
            }}
          />

          {/* Footer */}
          <p
            style={{
              fontSize:      12,
              color:         "#9B9B96",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin:        0,
            }}
          >
            belapopoficial.com.br
          </p>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
      headers: {
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
      },
    },
  );
}
