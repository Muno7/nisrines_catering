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
        customBeige: '#E8D9CF',
        customBrown: '#2a1810'
      }
    },
  },
  plugins: [],
}