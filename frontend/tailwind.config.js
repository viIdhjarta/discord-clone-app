/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          primary: '#5865F2',
          secondary: '#4f545c',
          dark: '#36393f',
          darker: '#2f3136',
          darkest: '#202225',
          green: '#3ba55d',
          red: '#ed4245',
          yellow: '#faa61a',
        },
      },
      fontFamily: {
        'whitney': ['Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}