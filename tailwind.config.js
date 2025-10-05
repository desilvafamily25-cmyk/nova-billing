/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f2f5f9",
          100: "#e6ebf3",
          200: "#c9d3e3",
          300: "#a6b6cf",
          400: "#7b90b6",
          500: "#4e6a9b",
          600: "#2f4e7f",
          700: "#1f3c68",
          800: "#142a4d",
          900: "#0f172a" // Nova navy
        },
        accent: {
          500: "#ef4444" // Nova red
        }
      },
      boxShadow: {
        card: "0 10px 25px -10px rgba(15, 23, 42, 0.25)"
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.25rem"
      }
    }
  },
  plugins: [],
}
