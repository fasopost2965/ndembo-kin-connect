/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ndembo Kin Connect — DRC flag palette
        brand: {
          navy:   '#0F172A',   // sidebar background
          blue:   '#1B4B8A',   // DRC flag blue
          cyan:   '#3A6B84',   // Connect accent
          gold:   '#DAA520',   // DRC flag gold
          'gold-light': '#FCD116', // bright gold
          red:    '#CE1126',   // DRC flag red
        },
        // Semantic aliases
        sidebar: '#0F172A',
        accent:  '#3A6B84',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
