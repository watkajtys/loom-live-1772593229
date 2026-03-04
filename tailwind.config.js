/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0A0A",
        "industrial-gray": "#1F1F1F",
        "hazard-yellow": "#FFC107",
        "ghost-white": "#F8F9FA",
        "obsidian-slate": "#1e293b",
        "industrial-orange": "#f97316",
        "base03": "#002b36",
        "base02": "#073642",
        "base01": "#586e75",
        "base00": "#657b83",
        "base0": "#839496",
        "silver": "#C0C0C0",
        "cyan": "#2aa198",
        "magenta": "#d33682",
        "violet": "#6c71c4",
        "blue": "#268bd2",
        "red": "#dc322f",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        mono2: ['Roboto Mono', 'monospace']
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
