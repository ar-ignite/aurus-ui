// tailwind.config.js
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
          50: '#e6f8f6',
          100: '#b3e9e4',
          200: '#80dad1',
          300: '#4dcbbf',
          400: '#1abcac',
          500: '#009688',
          600: '#008a7c',
          700: '#007d70',
          800: '#006f64',
          900: '#005249',
        },
      }
    },
  },
  plugins: [],
}