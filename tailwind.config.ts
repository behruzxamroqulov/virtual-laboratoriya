import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b9d1ff',
          300: '#8ab1ff',
          400: '#5c8bff',
          500: '#3a63f7',
          600: '#2947d9',
          700: '#2138ad',
          800: '#1f318a',
          900: '#1d2c6f'
        },
        surface: {
          light: '#ffffff',
          dark: '#0f1420'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 8px -2px rgb(0 0 0 / 0.06)'
      }
    }
  },
  plugins: []
};

export default config;
