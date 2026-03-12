import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // SOWTEE brand colors - deep blackish-gray with blue accents
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // High contrast for accessibility - deep blackish-gray theme
        aac: {
          bg: 'rgb(var(--aac-bg) / <alpha-value>)',
          surface: 'rgb(var(--aac-surface) / <alpha-value>)',
          card: 'rgb(var(--aac-card) / <alpha-value>)',
          highlight: 'rgb(var(--aac-highlight) / <alpha-value>)',
          text: 'rgb(var(--aac-text) / <alpha-value>)',
          muted: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'Amiri', 'sans-serif'],
      },
      fontSize: {
        // Large sizes for AAC accessibility
        'aac-sm': ['1.25rem', { lineHeight: '1.75rem' }],
        'aac-base': ['1.5rem', { lineHeight: '2rem' }],
        'aac-lg': ['2rem', { lineHeight: '2.5rem' }],
        'aac-xl': ['2.5rem', { lineHeight: '3rem' }],
        'aac-2xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      spacing: {
        // Touch-friendly spacing
        'touch': '48px',
        'touch-lg': '64px',
      },
      animation: {
        'gaze-pulse': 'gaze-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'selection-glow': 'selection-glow 0.5s ease-in-out',
      },
      keyframes: {
        'gaze-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        'selection-glow': {
          '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)' },
          '70%': { boxShadow: '0 0 0 15px rgba(59, 130, 246, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
        },
      },
    },
  },
  plugins: [],
}
