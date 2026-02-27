/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink:   { 50:'#f0f0ee', 100:'#d9d8d4', 900:'#1a1917' },
        amber: { 400:'#fbbf24', 500:'#f59e0b' },
        slate: { 800:'#1e293b', 900:'#0f172a' },
      }
    }
  },
  plugins: []
}
