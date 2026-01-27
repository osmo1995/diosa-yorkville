/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'divine-gold': '#C9A861',
        'deep-charcoal': '#2B2B2B',
        'soft-champagne': '#F5EFE7',
        'goddess-white': '#FAF8F5',
      },
      fontFamily: {
        'serif': ['Cormorant Garamond', 'serif'],
        'sans': ['Montserrat', 'sans-serif'],
        'accent': ['Allura', 'cursive'],
      },
    },
  },
  plugins: [],
}
