/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:
          '0 1px 2px rgba(42, 24, 16, 0.05), 0 8px 28px -6px rgba(42, 24, 16, 0.1)',
        'soft-lg':
          '0 4px 14px rgba(42, 24, 16, 0.07), 0 20px 42px -14px rgba(154, 52, 18, 0.14)',
        'soft-xl':
          '0 24px 52px -18px rgba(42, 24, 16, 0.24)',
      },
      colors: {
        ink: {
          900: '#1a1410',
          800: '#2c2420',
          700: '#4a3f38',
          600: '#6b5e55',
          500: '#8a7d73',
        },
        accent: {
          50: '#fdf8f5',
          100: '#fceee5',
          200: '#f5d4c4',
          300: '#e8b39a',
          400: '#d4622a',
          500: '#c2410c',
          600: '#9a3412',
          700: '#7c2d12',
          800: '#431407',
          900: '#2c1210',
        },
        brand: {
          cream: '#f7f0e6',
          accent: '#9a3412',
          muted: '#6b5e55',
          surface: '#efe6d9',
          ink: '#1a1410',
        },
        // Avisos e cartões de atenção (âmbar clássico).
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
