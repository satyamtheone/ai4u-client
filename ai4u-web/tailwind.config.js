/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
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
      animation: {
        fadeInBackdrop: "fadeInBackdrop 0.3s ease-out",
        slideInQuiz: "slideInQuiz 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};
