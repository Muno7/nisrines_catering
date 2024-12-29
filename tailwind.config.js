/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      },
      colors: {
        customRed: "rgba(237, 43, 43, 0.7)",
        offWhite: '#E8D9CF'
      }
    },
  },
  plugins: [],
}