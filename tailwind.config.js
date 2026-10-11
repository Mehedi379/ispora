/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f3fa", 100: "#dbe2f0", 200: "#b8c6e0",
          700: "#1b2a4a", 800: "#111d36", 900: "#0b1526", 950: "#070e1c",
        },
        gold: {
          300: "#f3d79b", 400: "#ecc571", 500: "#d4af37",
          600: "#b8942a", 700: "#95761f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 20px -4px rgba(212,175,55,0.35)",
        premium: "0 10px 40px -10px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
