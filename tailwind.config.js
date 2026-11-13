/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0B14',
        surface: {
          DEFAULT: '#121224',
          subtle: '#181830',
          card: '#1A1A34',
          border: '#27274D',
        },
        spotify: {
          DEFAULT: '#1DB954',
          hover: '#1ed760',
          glow: 'rgba(29, 185, 84, 0.35)',
        },
        discord: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          glow: 'rgba(88, 101, 242, 0.35)',
        },
        youtube: {
          DEFAULT: '#FF0000',
          hover: '#CC0000',
        },
        neon: {
          purple: '#A855F7',
          cyan: '#06B6D4',
          pink: '#EC4899',
        },
      },
      fontFamily: {
        display: ['Righteous', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-bar': 'wave-bar 1.2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'wave-bar': {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
      },
    },
  },
  plugins: [],
};
