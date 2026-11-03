import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        snes: {
          purple: '#6b5b95',
          lavender: '#a696c8',
          shell: '#d2d0d8',
          darkshell: '#1b1926',
          card: '#252236',
          accent: '#f59e0b',
          red: '#e11d48',
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#eab308',
        },
      },
    },
  },
  plugins: [],
};

export default config;
