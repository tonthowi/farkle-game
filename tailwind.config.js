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
          darkest: '#0a0603',
          dark:    '#14100a',
          DEFAULT: '#1f1810',
          light:   '#2b2118',
          grain:   '#3a2c1f',
        },
        felt: {
          darkest: '#0d1e16',
          dark:    '#143425',
          DEFAULT: '#1c4632',
          light:   '#265a42',
          edge:    '#0a1a12',
        },
        gold: {
          dim:    '#7a5a1f',
          DEFAULT:'#c9994a',
          bright: '#e8c374',
          leaf:   '#f3d989',
        },
        parchment: {
          dim:    '#7a6a4b',
          DEFAULT:'#cdb992',
          bright: '#ece1c1',
        },
        bone: '#ece2cc',
        danger: {
          DEFAULT: '#7a1f1f',
          bright:  '#b13838',
        },
        dice: {
          face: '#ece2cc',
          pip:  '#1a1208',
          border: '#a89870',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'Georgia', 'serif'],
        body:   ['Cormorant Garamond', 'Georgia', 'serif'],
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
          '0%, 100%': { boxShadow: '0 0 5px #c9994a, 0 0 10px #c9994a40' },
          '50%': { boxShadow: '0 0 15px #c9994a, 0 0 30px #c9994a80' },
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
