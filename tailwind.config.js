/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          darkest: '#0d0700',
          dark: '#1a0f00',
          DEFAULT: '#2d1b00',
          light: '#4a2c00',
          lighter: '#6b3f00',
        },
        felt: {
          dark: '#0f2318',
          DEFAULT: '#1a3a2a',
          light: '#2a5040',
        },
        gold: {
          dim: '#8a6400',
          DEFAULT: '#d4a017',
          bright: '#f5c842',
          shine: '#ffe680',
        },
        parchment: {
          dim: '#c4b490',
          DEFAULT: '#f5e6c8',
          bright: '#fdf5e4',
        },
        danger: {
          dark: '#7a1e1e',
          DEFAULT: '#c0392b',
          light: '#e74c3c',
        },
        dice: {
          face: '#f5f0e8',
          pip: '#2d1b00',
          border: '#c4b490',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'shake': 'shake 0.4s ease-in-out',
        'float': 'float 2s ease-in-out infinite',
        'pulse-gold': 'pulseGold 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px #d4a017, 0 0 10px #d4a01740' },
          '50%': { boxShadow: '0 0 15px #d4a017, 0 0 30px #d4a01780' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
