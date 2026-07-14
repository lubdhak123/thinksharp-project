import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-light": "var(--brand-light)",
        ink: "var(--ink)",
        mist: "var(--mist)",
        paper: "var(--paper)",
        border: "var(--border)",
        clay: "#B91C1C", // separate red for errors
        
        // Retain any existing legacy aliases to prevent breaking
        ink_legacy: "#17211f",
        muted: "#65716e",
        line: "#d9e1de",
        mint: "#2f8f71",
        "mint-dark": "#1f6f56",
        gold: "#d49a2a",
        blue: "#2f6f9f",
        rose: "#bd4b5f"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },

      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 31, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;

