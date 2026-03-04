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
        "obsidian-slate": "#0A0A0A",
        "industrial-orange": "#F97316",
        "ghost-white": "#F8F8FF",
        "industrial-gray": "#1F1F1F",
        "console-border": "#27272a",
        "console-surface": "#18181b",
        "ghost-text": "#3f3f46",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "ibm": ["IBM Plex Mono", "monospace"],
        "mono": ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        "none": "0px",
        "DEFAULT": "0px",
      },
    },
  },
  plugins: [],
}
