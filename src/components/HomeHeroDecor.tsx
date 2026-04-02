import { useEffect, useState } from 'react';
import { fetchPokemonById, type PokemonBrief } from '../utils/api';

const PIKACHU_ART =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';

export function HeroPikachu({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex shrink-0 items-end justify-center ${className}`}
    >
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-t from-accent/25 to-transparent blur-2xl motion-reduce:blur-none"
        aria-hidden
      />
      <img
        src={PIKACHU_ART}
        alt="Pikachu waving hello"
        className="relative z-[1] h-36 w-36 object-contain drop-shadow-lg motion-safe:animate-bounce-gentle sm:h-44 sm:w-44"
        width={176}
        height={176}
        draggable={false}
      />
    </div>
  );
}

export function FloatingMonsStrip() {
  const [mons, setMons] = useState<PokemonBrief[]>([]);

  useEffect(() => {
    let cancelled = false;
    const ids = new Set<number>();
    while (ids.size < 4) {
      ids.add(Math.floor(Math.random() * 386) + 1);
    }
    void (async () => {
      try {
        const list = await Promise.all(
          [...ids].map((id) => fetchPokemonById(id)),
        );
        if (!cancelled) setMons(list.filter((m) => m.artworkUrl));
      } catch {
        if (!cancelled) setMons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mons.length) return null;

  return (
    <div
      className="mt-6 flex flex-wrap items-end justify-center gap-4 sm:gap-6"
      aria-hidden
    >
      {mons.map((m, i) => (
        <img
          key={m.id}
          src={m.artworkUrl}
          alt=""
          className="h-16 w-16 object-contain opacity-90 drop-shadow-md motion-safe:animate-float-mon sm:h-20 sm:w-20"
          style={{
            animationDelay: `${i * 0.35}s`,
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}
