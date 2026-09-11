import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // 8px grid — every spacing token is a multiple of 8.
    extend: {
      colors: {
        bg: "#FAFAFA",
        cream: "#F5F5F0",
        ink: "#1A1A1A",
        muted: "#6B6B6B",
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        danger: "#DC2626",
        success: "#16A34A",
        hairline: "rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      fontSize: {
        hero: ["4.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "hero-sm": ["3.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        section: ["2.75rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "section-sm": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "product-title": ["1.375rem", { lineHeight: "1.3" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.9375rem", { lineHeight: "1.6" }],
        label: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.1em" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.1em" }],
      },
      spacing: {
        "18": "4.5rem",
        "30": "7.5rem",
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.06)",
        drawer: "-8px 0 40px rgba(0,0,0,0.08)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-badge": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.85" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-badge": "pulse-badge 2s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
