import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#0E0D13",
          900: "#14121A",
          850: "#1A1822",
          800: "#221F2D",
          700: "#2C283B",
          600: "#3D3850",
        },
        terracotta: {
          500: "#E26D54",
          600: "#D05E46",
        },
        parchment: {
          400: "#E5B268",
          500: "#D8A252",
        },
        pearl: {
          50: "#F6F3EE",
          100: "#EDE7DC",
        },
        mist: {
          300: "#BBB4CA",
          400: "#9992A8",
          500: "#787285",
        },
        // Backward compatibility palette aliases
        ink: {
          950: "#0E0D13",
          900: "#14121A",
        },
        plum: {
          900: "#1A1822",
          800: "#221F2D",
          700: "#2C283B",
        },
        ember: {
          500: "#E26D54",
          600: "#D05E46",
        },
        gold: {
          400: "#E5B268",
          500: "#D8A252",
        },
        linen: {
          50: "#F6F3EE",
          100: "#EDE7DC",
        },
        haze: {
          300: "#BBB4CA",
          400: "#9992A8",
          500: "#787285",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: [
          "var(--font-sans-humanist)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
