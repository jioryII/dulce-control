/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAFAF8',
        'bg-secondary': '#F6F4F1',
        'bg-dark': '#F2F0EC',
        'brand-primary': '#E67E43',
        'brand-accent': '#FFB347',
        'brand-soft': '#FFF3E0',
        'pastel-cream': '#FFFDE7',
        'pastel-orange': '#FFE0B2',
        'pastel-cyan': '#E0F7FA',
        'pastel-red': '#FFCDD2',
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
