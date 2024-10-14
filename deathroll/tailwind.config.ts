import type { Config } from "tailwindcss";

const config: Config = {
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			helvetica: ['var(--font-helvetica)', 'sans-serif'],
  			sans: ['var(--font-helvetica)', 'system-ui', 'sans-serif'],
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require('daisyui'),],
};
export default config;
