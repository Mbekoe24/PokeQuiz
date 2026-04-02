import { useTheme } from '../context/useTheme';

/** Classic incandescent shape: round glass, neck, screw base (stroke reads clearly at small sizes). */
function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 18h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 22h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg border border-line bg-canvas-surface text-accent shadow-sm transition hover:bg-canvas-elevated hover:text-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <LightbulbIcon className={`h-6 w-6 ${isDark ? 'opacity-100' : 'opacity-90'}`} />
    </button>
  );
}
