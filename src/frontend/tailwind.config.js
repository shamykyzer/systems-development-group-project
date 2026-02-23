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
    },
  },
  plugins: [],
}