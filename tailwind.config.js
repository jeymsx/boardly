/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0A0E1A', 900: '#0F1629', 800: '#161D35',
          700: '#1E2847', 600: '#2A3560', 500: '#3B4B7A',
        },
        emerald: {
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0',
          300: '#6EE7B7', 400: '#34D399', 500: '#10B981',
          600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B',
        },
        jade:  { 400: '#34D399', 500: '#10B981', 600: '#059669' },
        rose:  { 400: '#FB7185', 500: '#F43F5E' },
        sky:   { 400: '#38BDF8', 500: '#0EA5E9' },
        slate: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569',
          700: '#334155', 800: '#1E293B', 900: '#0F172A',
        },
      },
      backgroundImage: {
        'grid-ink':   "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-5 5L5 -5M35 45L45 35' stroke='%232A3560' stroke-width='0.5' opacity='0.4'/%3E%3C/svg%3E\")",
        'grid-light': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-5 5L5 -5M35 45L45 35' stroke='%23e2e8f0' stroke-width='0.8' opacity='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':    'fadeIn 0.25s ease-out',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'progress':   'progressFill 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp:      { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown:    { from: { transform: 'translateY(-20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn:      { from: { transform: 'scale(0.92)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        progressFill: { from: { width: '0%' }, to: {} },
      },
      boxShadow: {
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.2)',
        'glow-jade':    '0 0 20px rgba(16, 185, 129, 0.25)',
        'card':         '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-dark':    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover':   '0 4px 16px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
