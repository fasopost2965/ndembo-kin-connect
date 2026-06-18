/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Ndembo Kin Connect — design tokens canoniques ──
        // Fonds sombres (sidebar, boutons CTA, dashboard)
        'nkc-900': '#07101A',   // fond sidebar + boutons primaires
        'nkc-800': '#0A1628',   // topbar dashboard
        'nkc-700': '#0F172A',   // fond principal dashboard
        'nkc-600': '#132130',   // cartes KPI dashboard
        'nkc-500': '#132730',   // hover boutons
        // Bleu/ardoise (liens, icônes, focus)
        'nkc-slate': '#3A6B84',
        // Cyan Connect (avatar gradient fin, accents)
        'nkc-cyan': '#7CC8E8',
        // Or RDC (nav active, texte CTA sur fond sombre)
        'nkc-gold': '#FCD116',
        'nkc-gold-dark': '#DAA520',
        // Textes
        'nkc-text': '#0F172A',
        'nkc-text-2': '#334155',
        'nkc-text-3': '#64748B',
        'nkc-text-4': '#94A3B8',
        // Surfaces & bordures
        'nkc-border': '#E2E8F0',
        'nkc-border-light': '#E8ECF1',
        'nkc-bg': '#F0F2F5',
        'nkc-bg-soft': '#F1F5F9',
        'nkc-bg-form': '#F8FAFC',
        // Sémantique
        'nkc-success': '#10B981',
        'nkc-warning': '#F59E0B',
        'nkc-error': '#EF4444',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'btn': '10px',
        'card': '16px',
        'card-sm': '14px',
        'badge': '8px',
        'pill': '20px',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05)',
        'card-md': '0 1px 4px rgba(0,0,0,0.04)',
        'elevated': '0 8px 24px rgba(15,23,42,0.12)',
        'drawer': '-8px 0 40px rgba(0,0,0,0.15)',
      },
      animation: {
        spin: 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
