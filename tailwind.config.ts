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
        noir: {
          950: "#07070A",
          900: "#0E0E14",
          800: "#1B1B24",
          700: "#2C2C37",
          600: "#3E3E4A",
          500: "#585866",
          400: "#777787"
        },
        blush: {
          50: "#FAF7F8",
          100: "#F6D6E2"
        },
        luxe: {
          600: "#B80F5A"
        }
      },
      boxShadow: {
        "soft-luxe": "0 20px 40px -30px rgba(184, 15, 90, 0.45)",
        "card-luxe": "0 18px 35px -28px rgba(7, 7, 10, 0.65)"
      },
      borderRadius: {
        "luxe": "1.25rem"
      },
      letterSpacing: {
        luxe: "0.08em"
      },
      backgroundImage: {
        "luxe-glow":
          "radial-gradient(circle at top, rgba(184, 15, 90, 0.25), rgba(7, 7, 10, 0))",
        "luxe-sheen":
          "linear-gradient(135deg, rgba(246, 214, 226, 0.28), rgba(184, 15, 90, 0.1))",
        "belapop-rose": "linear-gradient(135deg, #B80F5A 0%, #F06292 100%)"
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
