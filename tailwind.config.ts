import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/popup/**/*.{ts,tsx,html}',
    './src/options/**/*.{ts,tsx,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kick: {
          primary: '#53fc18',
          dark: '#0a0e12',
          surface: '#13181f',
          border: '#1f2731',
          muted: '#6b7888',
          text: '#e8eef7',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(83,252,24,0.15), 0 4px 24px -8px rgba(83,252,24,0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
