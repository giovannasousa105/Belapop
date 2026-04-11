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
      colors: {
        bpBlack: "#1E1E1E",
        bpBlackSoft: "#5B3138",
        bpPink: "#D8A0AC",
        bpPinkSoft: "#F6E8EA",
        bpPinkLux: "#F8EEF0",
        bpPinkCta: "#D51E71",
        bpOffWhite: "#FBF7F4",
        bpGraphite: "#6E5F61",
        bpRoseGold: "#B88E8E"
      },
      boxShadow: {
        bpSoft: "0 18px 48px rgba(36,31,32,0.10)",
        bpMicro: "0 10px 24px rgba(36,31,32,0.08)"
      },
      borderRadius: {
        bpSm: "10px",
        bpMd: "16px",
        bpLg: "22px"
      },
      backgroundImage: {
        bpGlow:
          "radial-gradient(circle at top, rgba(216, 160, 172, 0.24), rgba(30, 30, 30, 0))",
        bpSheen:
          "linear-gradient(135deg, rgba(246, 232, 234, 0.96), rgba(216, 160, 172, 0.18))",
        "belapop-rose": "linear-gradient(135deg, #D8A0AC 0%, #5B3138 100%)"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
        editorial: ["var(--font-playfair)", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
