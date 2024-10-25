import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
  theme: {
    extend: {
      keyframes: {
        shakeDelayed: {
          '0%, 92%': { transform: 'translate(50%, -50%) rotate(12deg)' },
          '93%, 95%, 97%, 99%': { transform: 'translate(47%, -53%) rotate(12deg)' },
          '94%, 96%, 98%, 100%': { transform: 'translate(53%, -47%) rotate(12deg)' },
        }
      },
      animation: {
        'shake-delayed': 'shakeDelayed 8s ease-in-out infinite',
      }
    }
  },
	plugins: [daisyui],
  daisyui: {
		themes: ["black", "dark", "dracula"],
	},
};
export default config;
