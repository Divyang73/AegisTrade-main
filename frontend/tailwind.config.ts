import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: '#121214',
        panelSoft: '#17171B',
        accent: '#7EE787',
        accentAlt: '#63B3FF',
        danger: '#FF6B6B',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
