/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-850': '#1a202e',
        'gray-750': '#2d3748',
      }
    },
  },
  plugins: [],
}