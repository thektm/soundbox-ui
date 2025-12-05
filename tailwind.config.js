/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
    fontFamily: {
      sans: ['Vazir', 'ui-sans-serif', 'system-ui', 'Arial', 'Helvetica', 'sans-serif'],
    },
  },
  plugins: [],
};
