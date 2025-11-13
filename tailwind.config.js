/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'civil': '#3B82F6',
        'eletrica': '#F59E0B',
        'combate': '#EF4444',
        'climatizacao': '#10B981',
      }
    },
  },
  plugins: [],
}

