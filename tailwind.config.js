/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#02B784',
          dark: '#003A42'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        card: '0 8px 20px -4px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
};
