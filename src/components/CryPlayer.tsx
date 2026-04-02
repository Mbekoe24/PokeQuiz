import { useCallback, useRef, useState } from 'react';

interface CryPlayerProps {
  cryUrl: string;
  disabled?: boolean;
}

export default function CryPlayer({ cryUrl, disabled }: CryPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [played, setPlayed] = useState(false);
  const [err, setErr] = useState(false);

  const play = useCallback(() => {
    if (!cryUrl || disabled) return;
    setErr(false);
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => setErr(true));
    setPlayed(true);
  }, [cryUrl, disabled]);

  if (!cryUrl) {
    return (
      <p className="text-center text-xs text-ink-muted">No cry for this Pokémon.</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <audio ref={audioRef} src={cryUrl} preload="auto" className="hidden" />
      <button
        type="button"
        onClick={play}
        disabled={disabled}
        className="rounded-full border-2 border-line bg-canvas-elevated px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
        aria-label={played ? 'Play Pokémon cry again' : 'Play Pokémon cry'}
      >
        {played ? 'Play cry again' : 'Play cry'}
      </button>
      {err && (
        <p className="text-xs text-bad" role="status">
          Could not play audio.
        </p>
      )}
    </div>
  );
}
