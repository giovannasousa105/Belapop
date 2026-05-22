"use client";

interface PontosDisplayProps {
  pontos: number;
  label?: string;
  tamanho?: "sm" | "md" | "lg";
}

export function PontosDisplay({ pontos, label = "pontos", tamanho = "md" }: PontosDisplayProps) {
  const tamanhos = { sm: 14, md: 18, lg: 24 };
  const fontSize = tamanhos[tamanho];

  return (
    <span
      style={{
        fontVariantNumeric: "tabular-nums",
        fontSize,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
      aria-label={`${pontos} ${label}`}
    >
      {pontos.toLocaleString("pt-BR")}
      {label ? (
        <span style={{ fontSize: fontSize * 0.65, fontWeight: 400, color: "rgba(0,0,0,0.45)", marginLeft: 4 }}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
