/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--color-canvas)',
          surface: 'var(--color-surface)',
          elevated: 'var(--color-elevated)',
          well: 'var(--color-well)',
        },
        line: 'var(--color-border)',
        ink: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
        },
        brand: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          muted: 'var(--color-accent-muted)',
        },
        ok: 'var(--color-success)',
        bad: 'var(--color-danger)',
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.03)' },
        },
      },
      animation: {
        'bounce-gentle': 'bounce-gentle 3s ease-in-out infinite',
        'float-mon': 'float-soft 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
