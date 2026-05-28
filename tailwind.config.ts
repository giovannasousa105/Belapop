import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      screens: {
        tablet: '860px',
      },
      keyframes: {
        'belapop-marquee': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'belapop-marquee 32s linear infinite',
      },
      colors: {
        // ── Paleta legada (mantida para compatibilidade) ──────────────────
        bpBlack:     "#1E1E1E",
        bpBlackSoft: "#5B3138",
        bpPink:      "#D8A0AC",
        bpPinkSoft:  "#F6E8EA",
        bpPinkLux:   "#F8EEF0",
        bpPinkCta:   "#D51E71",
        bpOffWhite:  "#FBF7F4",
        bpGraphite:  "#6E5F61",
        bpRoseGold:  "#B88E8E",
        // ── Nova paleta — silent luxury ───────────────────────────────────
        nude: {
          50:  "#FDFCFB",
          100: "#FAF8F5",
          150: "#F5F2EE",
          200: "#EDE9E3",
        },
        ink: {
          900: "#111110",
          800: "#2A2A28",
          700: "#4A4A47",
          600: "#6B6B67",
          400: "#9B9B96",
          200: "#D4D3CE",
          100: "#E8E8E4",
        },
        accent: {
          50:  "#FDF4F1",
          100: "#F7E2D9",
          200: "#EFC4B0",
          400: "#D4845F",
          600: "#A85A38",
          800: "#7A3D22",
        },
      },
      boxShadow: {
        // Legados (usar apenas em transição — migrar para borda 0.5px)
        bpSoft:  "0 18px 48px rgba(36,31,32,0.10)",
        bpMicro: "0 10px 24px rgba(36,31,32,0.08)",
        // Novo sistema — apenas funcionais, nunca decorativos
        "ds-focus":   "0 0 0 2px var(--nude-50), 0 0 0 4px var(--ink-900)",
        "ds-float":   "0 2px 8px rgba(17,17,16,0.08), 0 0 0 0.5px rgba(17,17,16,0.06)",
        "ds-tooltip": "0 1px 4px rgba(17,17,16,0.10)",
      },
      borderRadius: {
        // Legados corrigidos para o padrão luxury (valores menores)
        bpSm: "4px",   // era 10px — corrigido
        bpMd: "4px",   // era 16px — corrigido
        bpLg: "6px",   // era 22px — corrigido
        // Escala do design system
        "ds-xs":   "2px",
        "ds-sm":   "4px",
        "ds-md":   "6px",
        "ds-lg":   "8px",
        "ds-xl":   "12px",
      },
      backgroundImage: {
        bpGlow:
          "radial-gradient(circle at top, rgba(216, 160, 172, 0.24), rgba(30, 30, 30, 0))",
        bpSheen:
          "linear-gradient(135deg, rgba(246, 232, 234, 0.96), rgba(216, 160, 172, 0.18))",
        "belapop-rose": "linear-gradient(135deg, #D8A0AC 0%, #5B3138 100%)",
      },
      fontFamily: {
        // DM Sans como sans principal, DM Serif Display como serif editorial
        sans:      ["var(--font-sans)", "var(--font-manrope)", "sans-serif"],
        serif:     ["var(--font-serif)", "var(--font-playfair)", "serif"],
        // Legados mantidos
        display:   ["var(--font-cormorant)", "serif"],
        editorial: ["var(--font-playfair)", "serif"],
        headline:  ["var(--font-playfair)", "serif"],
        body:      ["var(--font-inter)", "sans-serif"],
        mono:      ["var(--font-mono)", "monospace"],
      },
    }
  },
  plugins: []
};

export default config;
