/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pinkcafe: {
          DEFAULT: '#F6D9D2',
        },
        pinkcafe2: {
          DEFAULT: '#423b39',
        },
        blackbrown: {
          DEFAULT: '#2d2826',
        },
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(to bottom, #fed8d4 0%, #f8cecc 12%, #f2c4c2 25%, #ecb8b6 38%, #e4acaa 50%, #dca09e 62%, #d49492 75%, #cd8886 88%, #c57c7a 100%)',
      },
    },
  },
  plugins: [],
}