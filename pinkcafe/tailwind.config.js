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
        'dashboard-gradient': 'linear-gradient(to bottom, #f5dce0 0%, #efd2d6 12%, #e8c8cc 25%, #e0bcc0 38%, #d8b0b4 50%, #d0a4a8 62%, #c9989c 75%, #c18c90 88%, #b98084 100%)',
      },
    },
  },
  plugins: [],
}