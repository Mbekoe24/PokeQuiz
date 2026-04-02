import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PokemonHomeFact } from '../utils/api';
import { fetchRandomPokemonFact } from '../utils/api';

const AUTO_INTERVAL_MS = 10_000;

/** Oldest cursor we allow when viewing the tail (“at most 2 steps back” from latest). */
function minBackCursor(factsLength: number): number {
  if (factsLength < 3) return 0;
  return factsLength - 3;
}

type Nav = { facts: PokemonHomeFact[]; cursor: number };

interface PokemonFactCardProps {
  className?: string;
}

export default function PokemonFactCard({ className = '' }: PokemonFactCardProps) {
  const [nav, setNav] = useState<Nav>({ facts: [], cursor: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const loadingRef = useRef(false);

  const displayed = nav.facts.length > 0 ? nav.facts[nav.cursor] ?? null : null;

  const canGoBack = useMemo(() => {
    if (nav.facts.length === 0) return false;
    return nav.cursor > minBackCursor(nav.facts.length);
  }, [nav.cursor, nav.facts.length]);

  const canGoForwardInHistory = useMemo(
    () => nav.cursor < nav.facts.length - 1,
    [nav.cursor, nav.facts.length],
  );

  const loadNewFact = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const next = await fetchRandomPokemonFact();
      if (next) {
        setNav((prev) => {
          const base = prev.facts.slice(0, prev.cursor + 1);
          const facts = [...base, next];
          return { facts, cursor: facts.length - 1 };
        });
      } else {
        setNav((prev) => {
          if (prev.facts.length === 0) {
            queueMicrotask(() => setError(true));
          }
          return prev;
        });
      }
    } catch {
      setNav((prev) => {
        if (prev.facts.length === 0) {
          queueMicrotask(() => setError(true));
        }
        return prev;
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNewFact();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial load
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduceMotion(mq.matches);
      if (mq.matches) setAutoRotate(false);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!autoRotate) return undefined;
    const id = window.setInterval(() => {
      if (document.hidden || loadingRef.current) return;
      void loadNewFact();
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoRotate, loadNewFact]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setNav((prev) => ({ ...prev, cursor: prev.cursor - 1 }));
  }, [canGoBack]);

  const goForwardOrNew = useCallback(() => {
    if (canGoForwardInHistory) {
      setNav((prev) => ({ ...prev, cursor: prev.cursor + 1 }));
      return;
    }
    void loadNewFact();
  }, [canGoForwardInHistory, loadNewFact]);

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-line bg-gradient-to-br from-accent/8 via-canvas-surface to-brand/10 p-6 shadow-sm ring-1 ring-accent/10 ${className}`}
      role="region"
      aria-labelledby="pokemon-fact-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="pokemon-fact-heading" className="text-sm font-semibold text-ink-muted">
          Cool Pokémon fact
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 text-xs ${reduceMotion ? 'cursor-not-allowed opacity-70' : 'text-ink-muted'}`}
          >
            <input
              type="checkbox"
              className="rounded border-line"
              checked={autoRotate}
              disabled={reduceMotion || (loading && nav.facts.length === 0)}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            <span>
              New fact every 10s
              {reduceMotion ? ' (off: reduced motion)' : ''}
            </span>
          </label>
          <div className="flex rounded-lg border border-line bg-canvas-elevated p-0.5">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Previous fact (up to 2 back)"
              title="Previous fact"
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-ink transition hover:bg-canvas-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goForwardOrNew}
              disabled={loading && !canGoForwardInHistory}
              aria-label={
                canGoForwardInHistory ? 'Next fact in history' : 'Load another random fact'
              }
              title={canGoForwardInHistory ? 'Next' : 'New random fact'}
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-ink transition hover:bg-canvas-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Browse the last few facts with arrows—back is limited to two steps. Forward at the end fetches a new random card.
      </p>

      <div className="mt-4 flex min-h-[140px] flex-1 flex-col gap-3">
        {loading && nav.facts.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-3 w-4/5 animate-pulse rounded bg-canvas-elevated motion-reduce:animate-none" />
            <div className="h-3 w-full animate-pulse rounded bg-canvas-elevated motion-reduce:animate-none" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-canvas-elevated motion-reduce:animate-none" />
          </div>
        ) : null}

        {error && !loading && nav.facts.length === 0 ? (
          <p className="text-sm text-bad">
            Couldn&apos;t load a fact.{' '}
            <button
              type="button"
              className="font-medium underline decoration-bad hover:text-ink"
              onClick={() => void loadNewFact()}
            >
              Try again
            </button>
          </p>
        ) : null}

        {displayed ? (
          <>
            <div className="flex gap-3">
              {displayed.artworkUrl ? (
                <img
                  src={displayed.artworkUrl}
                  alt=""
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] shrink-0 rounded-xl border border-line/80 bg-canvas-elevated object-contain p-1"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-line bg-canvas-elevated text-2xl"
                  aria-hidden
                >
                  ?
                </div>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-muted">
                Featured: <span className="text-ink">{displayed.pokemonName}</span>
              </p>
            </div>
            <p className="text-sm leading-relaxed text-ink">{displayed.text}</p>
            {loading && nav.facts.length > 0 && !canGoForwardInHistory ? (
              <p className="text-xs text-ink-muted opacity-70">Loading next fact…</p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
