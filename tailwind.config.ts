import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "neural-gradient": "linear-gradient(-45deg, hsl(230 25% 12%), hsl(230 25% 8%), hsl(210 100% 15%))",
        "wealth-pattern": "radial-gradient(circle at center, hsla(210, 100%, 50%, 0.1) 0%, transparent 70%)",
      },
      boxShadow: {
        'glow-sm': '0 0 10px -1px hsla(210, 100%, 50%, 0.2)',
        'glow': '0 0 15px -1px hsla(210, 100%, 50%, 0.3)',
        'glow-lg': '0 0 25px -1px hsla(210, 100%, 50%, 0.4)',
      },
      colors: {
        background: "hsl(230 25% 8%)", // Dark background
        foreground: "hsl(210 40% 98%)",
        card: {
          DEFAULT: "hsl(230 25% 12%)", // Slightly lighter dark
          foreground: "hsl(210 40% 98%)",
        },
        popover: {
          DEFAULT: "hsl(230 25% 12%)",
          foreground: "hsl(210 40% 98%)",
        },
        primary: {
          DEFAULT: "hsl(210 100% 50%)", // Electric blue
          foreground: "hsl(210 40% 98%)",
          glow: "hsla(210 100% 50% / 0.2)", // Glow effect color
        },
        secondary: {
          DEFAULT: "hsl(230 25% 15%)",
          foreground: "hsl(210 40% 98%)",
        },
        muted: {
          DEFAULT: "hsl(230 25% 15%)",
          foreground: "hsl(215 20% 65%)",
        },
        accent: {
          DEFAULT: "hsl(199 89% 48%)", // Secondary electric blue
          foreground: "hsl(210 40% 98%)",
          glow: "hsla(199 89% 48% / 0.2)", // Glow effect color
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "flow": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-5px) scale(1.02)" },
        },
        "glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsla(210, 100%, 50%, 0)" },
          "50%": { boxShadow: "0 0 20px 5px hsla(210, 100%, 50%, 0.3)" },
        },
        "neural-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flow": "flow 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "neural-flow": "neural-flow 15s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
