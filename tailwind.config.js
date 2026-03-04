/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#FFC107",
        "background-light": "#1F1F1F",
        "background-dark": "#0A0A0A",
        "obsidian": "#0A0A0A",
        "industrial": "#1F1F1F",
        "hazard": "#FFC107",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
    },
  },
  plugins: [],
}
