/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pinkcafe: {
          DEFAULT: '#FFD1DC',
        },
        pinkcafe2: {
          DEFAULT: '#423b39',
        },
        blackbrown: {
          DEFAULT: '#2d2826',
        },
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(to bottom, #FFD1DC 0%, #FFC9D4 12%, #FFC1CC 25%, #F5B8C4 38%, #EBB0BC 50%, #E1A8B4 62%, #D7A0AC 75%, #CD98A4 88%, #C3909C 100%)',
      },
    },
  },
  plugins: [],
}