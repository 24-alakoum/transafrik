import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#070A0E',
        'bg-card': '#0F1117',
        'bg-surface': '#131820',
        'bg-raised': '#1A2133',
        'border-base': '#252E42',
        'border-active': '#2F3C58',
        'text-primary': '#EDF2FF',
        'text-secondary': '#8B98B8',
        'text-muted': '#50607E',
        accent: '#F97316',
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dmsans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.4)',
        glow: '0 0 20px rgba(249,115,22,0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        transafrik: {
          primary: '#F97316',
          'primary-content': '#ffffff',
          secondary: '#3B82F6',
          'secondary-content': '#ffffff',
          accent: '#A855F7',
          'accent-content': '#ffffff',
          neutral: '#1A2133',
          'neutral-content': '#EDF2FF',
          'base-100': '#070A0E',
          'base-200': '#0F1117',
          'base-300': '#131820',
          'base-content': '#EDF2FF',
          info: '#3B82F6',
          'info-content': '#ffffff',
          success: '#22C55E',
          'success-content': '#ffffff',
          warning: '#EAB308',
          'warning-content': '#000000',
          error: '#EF4444',
          'error-content': '#ffffff',
        },
      },
    ],
    darkTheme: 'transafrik',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}

export default config
