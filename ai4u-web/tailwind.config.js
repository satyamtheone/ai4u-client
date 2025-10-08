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
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          600: "#2563eb",
        },
        secondary: {
          500: "#10b981",
        },
        darkBackGround: {
          100: "#555555",
          200: "#3a3a3a",
          300: "#2a2a2a",
          400: "#b3b3b3",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#333333",
          800: "#0a0a0a",
          900: "#404040",
          950: "#1a1a1a",
          1000: "#000000cc",
          1150: "#0f1115",
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
