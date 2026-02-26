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
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(135deg, #F6D9D2 0%, #f0ccc4 50%, #ede8e7 100%)',
      },
    },
  },
  plugins: [],
}