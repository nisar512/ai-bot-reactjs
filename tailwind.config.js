/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary_blue: "#305BD4",
        light_blue: "#EDEFFD",
        second_blue:"#5367F3",
        primary_black: "#000000",
        second_black: "#2D2D2D",
        primary_white: "#FFFFFF",
        primary_bg: "#F7F8FC",
        primary_border: "#CBCBCB",
        second_border: "#ABABAB",
        error_bg:"#f2cccc40"
      },
    },
  },
  plugins: [],
}