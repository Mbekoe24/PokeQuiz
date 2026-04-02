function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic RNG from a string (e.g. share seed + question index). */
export function createSeededRandom(seedString: string): (min: number, max: number) => number {
  let state = hashString(seedString) || 1;
  return function randInt(min: number, max: number): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const u = state >>> 0;
    return Math.floor((u / 4294967296) * (max - min + 1)) + min;
  };
}

export function randomAlphanumericSeed(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(len);
    cryptoObj.getRandomValues(buf);
    for (let i = 0; i < len; i += 1) {
      out += chars[buf[i]! % chars.length]!;
    }
    return out;
  }
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return out;
}

export function dailyChallengeSeedString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `pokequiz-daily-${y}-${m}-${d}`;
}
