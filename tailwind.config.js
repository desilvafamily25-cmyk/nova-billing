/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        novablue: '#0f172a',
        novared: '#ef4444'
      }
    }
  },
  plugins: [],
}
