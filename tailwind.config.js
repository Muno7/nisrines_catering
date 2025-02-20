/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./public/*.html",
    "./public/styles/*.css",
    "./src/**/*.{js,ts,jsx,tsx}",
    './public/scripts/**/**/.js',
    './public/scripts/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      },
      colors: {
        customRed: "#ec1c2a",
        lightGray: '#818589',
        darkGray: '#3C4147'
      }
    },
  },
  plugins: [],
}