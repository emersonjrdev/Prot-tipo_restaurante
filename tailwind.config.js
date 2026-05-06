/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Mantemos o nome "amber" nos componentes: tons neutros claros + destaque teal (leve, sem libs extras).
        amber: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#94a3b8',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#1e293b',
          900: '#0f172a',
        },
        brand: {
          cream: '#fafafa',
          accent: '#0d9488',
          muted: '#71717a',
          surface: '#f4f4f5',
          ink: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
