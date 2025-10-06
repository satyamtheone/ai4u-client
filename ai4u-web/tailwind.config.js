/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        fadeInBackdrop: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInQuiz: {
          "0%": { opacity: "0", transform: "translateY(30px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      colors: {
        primary: {
          50: "#eff4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#6090fa",
          500: "#3b76f6",
          600: "#2563eb",
          700: "#1d58d8",
          800: "#1e4baf",
          900: "#1e408a",
          950: "#172a54",
        },
        secondary: {
          50: "#ecfdf7",
          100: "#d1faec",
          200: "#a7f3da",
          300: "#6ee7bf",
          400: "#34d39e",
          500: "#10b981",
          600: "#059666",
          700: "#047852",
          800: "#065f42",
          900: "#064e36",
          950: "#022c1e",
        },
        darkBackGround: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#b3b3b3",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#454545",
          900: "#404040",
          950: "#1a1a1a",
          1000: "#000000cc",
        },
      },
      animation: {
        fadeInBackdrop: "fadeInBackdrop 0.3s ease-out",
        slideInQuiz: "slideInQuiz 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};
