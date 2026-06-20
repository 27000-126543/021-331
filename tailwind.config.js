/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#e6edf5",
          100: "#c2d1e4",
          200: "#9ab3d1",
          300: "#7295be",
          400: "#537db0",
          500: "#3366a1",
          600: "#1e3a5f",
          700: "#1a3354",
          800: "#162d49",
          900: "#0e2034",
        },
        accent: {
          50: "#fef4e9",
          100: "#fce2c3",
          200: "#f9ce98",
          300: "#f5b96d",
          400: "#f2a84d",
          500: "#e87722",
          600: "#cf611a",
          700: "#b44b12",
          800: "#9a370b",
          900: "#671b03",
        },
        discipline: {
          airduct: "#4a90d9",
          waterpipe: "#2ecc71",
          cabletray: "#f39c12",
          firepipe: "#e74c3c",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
