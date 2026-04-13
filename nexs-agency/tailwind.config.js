/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {},
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%': {
            opacity: '0.7',
          },
          '50%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0.7',
          },
        },
      },
    },
  },
  plugins: [],
}