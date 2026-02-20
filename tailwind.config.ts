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
        bpBlack: "#0F0F10",
        bpBlackSoft: "#141416",
        bpPink: "#C2185B",
        bpPinkSoft: "#F4B6C2",
        bpOffWhite: "#FAF7F8",
        bpGraphite: "#2B2B2E"
      },
      boxShadow: {
        bpSoft: "0 10px 30px rgba(15,15,16,0.10)",
        bpMicro: "0 6px 18px rgba(15,15,16,0.08)"
      },
      borderRadius: {
        bpSm: "10px",
        bpMd: "16px",
        bpLg: "22px"
      },
      backgroundImage: {
        bpGlow:
          "radial-gradient(circle at top, rgba(194, 24, 91, 0.22), rgba(15, 15, 16, 0))",
        bpSheen:
          "linear-gradient(135deg, rgba(244, 182, 194, 0.22), rgba(194, 24, 91, 0.12))",
        "belapop-rose": "linear-gradient(135deg, #C2185B 0%, #F4B6C2 100%)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
