import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        graphite: '#2F343D',
        circuit: '#15B8A6',
        voltage: '#6D5EF7',
        frost: '#F7F9FC',
        limepulse: '#B7F34A',
      },
      boxShadow: {
        glass: '0 18px 50px rgba(17,24,39,.12)',
        focus: '0 18px 60px rgba(21,184,166,.18)',
      },
    },
  },
  plugins: [],
};

export default config;
