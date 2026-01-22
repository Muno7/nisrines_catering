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
        background: "#FDF8F5", // Cleaner off-white cream
        surface: "#FFF3EC",    // Soft peach/nude
        primary: {
          DEFAULT: "#E8822A",  // Rich Pumpkin
          hover: "#CF7020",
        },
        secondary: {
          DEFAULT: "#da5825",  // Burnt Terracotta
          hover: "#A13D18",
        },
        cta: {
          DEFAULT: "#521C0D",  // Deep Mahogany Brown
          hover: "#3E160A",
        },
        text: "#8A4B3A",     // Muted Copper
        accent: "#3E160A",       // Darkest Brown for legibility
        muted: "#8A4B3A",
      },
    },
  },
  plugins: [],
}
