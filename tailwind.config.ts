import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        brand: {
          50: "#edfcf5",
          100: "#d3f9e5",
          200: "#aaf0cf",
          300: "#73e3b2",
          400: "#3acd90",
          500: "#16b378",
          600: "#099160",
          700: "#07744f",
          800: "#095c40",
          900: "#084b36",
          950: "#032a1f",
        },
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        "gradient-y": "gradient-y 8s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "border-glow": "border-glow 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        "gradient-y": {
          "0%, 100%": { "background-position": "50% 0%" },
          "50%": { "background-position": "50% 100%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "shimmer": {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" },
        },
        "border-glow": {
          "0%, 100%": { "border-color": "rgba(16, 185, 129, 0.3)" },
          "50%": { "border-color": "rgba(16, 185, 129, 0.6)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(16, 185, 129, 0.25)",
        "glow": "0 0 30px -5px rgba(16, 185, 129, 0.3)",
        "glow-lg": "0 0 60px -10px rgba(16, 185, 129, 0.35)",
        "glow-emerald": "0 0 40px -10px rgba(16, 185, 129, 0.4)",
        "glow-fuchsia": "0 0 40px -10px rgba(217, 70, 239, 0.35)",
        "glow-fire": "0 0 20px -3px rgba(251, 146, 60, 0.35), 0 0 40px -8px rgba(239, 68, 68, 0.2)",
        "glow-fire-lg": "0 0 30px -3px rgba(251, 146, 60, 0.45), 0 0 60px -10px rgba(239, 68, 68, 0.25)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
