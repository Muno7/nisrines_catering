/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './scripts/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      },
      colors: {
        customRed: "rgba(237, 43, 43, 0.7)",
        lightGray: '#818589',
        darkGray: '#3C4147'
      }
    },
  },
  plugins: [],
}