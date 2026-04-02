interface TimerRingProps {
  remaining: number;
  total: number;
  practice?: boolean;
}

export default function TimerRing({ remaining, total, practice }: TimerRingProps) {
  if (practice) {
    return (
      <div
        className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full border-2 border-dashed border-accent/60 text-accent"
        aria-label="Practice mode, no timer"
      >
        <span className="text-lg font-bold">∞</span>
        <span className="text-[10px] font-medium uppercase text-ink-muted">
          Practice
        </span>
      </div>
    );
  }

  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const offset = c * (1 - pct);

  return (
    <div
      className="relative inline-flex h-[5.5rem] w-[5.5rem] items-center justify-center text-accent"
      aria-hidden
    >
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-line opacity-40"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute text-xl font-semibold tabular-nums text-ink">
        {remaining}
      </span>
    </div>
  );
}
