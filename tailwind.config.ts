import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0a0f1a",
          50: "#1a2332",
          100: "#151d2e",
          200: "#101729",
          300: "#0b1120",
          400: "#0a0f1a",
          500: "#070b14",
          600: "#04070e",
          700: "#010308",
          800: "#000000",
          900: "#000000",
        },
        charcoal: {
          DEFAULT: "#141b2d",
          light: "#1e293b",
          dark: "#0f172a",
        },
        cyan: {
          primary: "#0891b2",
          light: "#22d3ee",
          glow: "rgba(34, 211, 238, 0.5)",
        },
        glass: {
          border: "rgba(255, 255, 255, 0.08)",
          bg: "rgba(255, 255, 255, 0.03)",
        },
        primary: {
          DEFAULT: "#0891b2",
          light: "#22d3ee",
        },
        surface: {
          DEFAULT: "#141b2d",
          hover: "#1e293b",
        },
        background: "#0a0f1a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyan-gradient":
          "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(34, 211, 238, 0.3)",
        "glow-lg": "0 0 40px rgba(34, 211, 238, 0.4)",
        "glow-inner": "inset 0 0 20px rgba(34, 211, 238, 0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(34, 211, 238, 0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;