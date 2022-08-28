const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  content: ["./src/**/*.astro", "./src/**/*.tsx"],
  plugins: [require("@tailwindcss/typography")],
};
