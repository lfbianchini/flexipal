
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        usfgreen: {
          DEFAULT: "#00543C",
          light: "#237a5c",
        },
        usfgold: {
          DEFAULT: "#FFB100",
        },
        graybg: "#f8fafc",
        graydivider: "#ececec"
      },
      borderRadius: {
        lg: "1.25rem",
        md: "0.75rem",
        sm: "0.5rem"
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s cubic-bezier(0.39, 0.575, 0.565, 1) both",
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
