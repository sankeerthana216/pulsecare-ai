/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        card: 'rgba(15, 23, 42, 0.45)', // slate-900 with opacity
        border: 'rgba(255, 255, 255, 0.08)',
        primary: {
          DEFAULT: '#10b981', // emerald-500
          foreground: '#ffffff',
          hover: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          foreground: '#ffffff',
        },
        emergency: {
          DEFAULT: '#ef4444', // red-500
          foreground: '#ffffff',
          pulse: 'rgba(239, 68, 68, 0.2)',
        },
        muted: {
          DEFAULT: '#1e293b', // slate-800
          foreground: '#94a3b8', // slate-400
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-emerald': '0 8px 32px 0 rgba(16, 185, 129, 0.15)',
        'glass-red': '0 8px 32px 0 rgba(239, 68, 68, 0.15)',
      },
    },
  },
  plugins: [],
}
