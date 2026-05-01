/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d9e2ff',
          300: '#b8c9ff',
          400: '#8ca1ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#3f31d4',
          800: '#3729b0',
          900: '#2e248a',
        },
        accent: {
          pink: '#fb7185', /* Softer Rose/Pink */
          amber: '#f59e0b', /* Warmer Amber */
          emerald: '#10b981', /* Standard Emerald */
          violet: '#8b5cf6', /* Standard Violet */
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
