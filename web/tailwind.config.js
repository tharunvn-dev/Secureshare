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
          950: '#030712', // Obsidian void
          900: '#070c18', // Deep space
          850: '#0b1222', // Card base
          800: '#0f172a', // Surface elevated
          750: '#162035', // Highlight surface
          700: '#1e293b', // Borders
          emerald: '#10b981',
          cyan: '#06b6d4',
          indigo: '#6366f1',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
