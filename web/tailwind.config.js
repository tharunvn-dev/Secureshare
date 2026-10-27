/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0f1d',
          surface: '#111827',
          card: '#1e293b',
          border: '#334155',
          accent: '#38bdf8', // Cyber cyan
          accentGlow: 'rgba(56, 189, 248, 0.25)',
          success: '#10b981', // Emerald
          warning: '#f59e0b', // Amber
          danger: '#ef4444',  // Rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
