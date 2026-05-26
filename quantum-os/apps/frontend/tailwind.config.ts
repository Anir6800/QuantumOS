import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'quantum-bg': '#0f172a',
        'quantum-panel': '#1e293b',
        'quantum-border': '#334155',
        'quantum-cyan': '#06b6d4',
        'quantum-violet': '#8b5cf6',
        'quantum-green': '#10b981',
      },
    },
  },
  plugins: [],
};

export default config;
