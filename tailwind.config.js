/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
      colors: {
        background: "var(--bg-app)",
        surface: "var(--bg-surface)",
        hover: "var(--bg-hover)",
        primary: "var(--primary)",
        muted: "var(--text-muted)",

        // Semantic Colors
        lecture: "var(--color-lecture)",
        lab: "var(--color-lab)",
        project: "var(--color-project)",
        seminar: "var(--color-seminar)",
      },
      borderColor: {
        DEFAULT: "var(--border-subtle)",
        border: "var(--border-subtle)",
        primary: "var(--primary)",
      },
      textColor: {
        main: "var(--text-main)",
        muted: "var(--text-muted)",
        primary: "var(--primary)",
      },
      animation: {
        float: "float 20s infinite ease-in-out",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s infinite linear",
        "slide-down": "slideDown 0.3s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(30px, -50px) rotate(10deg)" },
          "66%": { transform: "translate(-20px, 20px) rotate(-5deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: { // Added based on usage in DataSyncIndicator
           "0%": { opacity: "0", transform: "translate(-50%, -20px)" },
           "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
