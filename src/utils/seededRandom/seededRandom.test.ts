import { describe, expect, it } from 'vitest';
import { createSeededRandom, dailyChallengeSeedString } from '.';

describe('createSeededRandom', () => {
  it('is deterministic for the same seed', () => {
    const a = createSeededRandom('quiz-seed-a');
    const b = createSeededRandom('quiz-seed-a');
    for (let i = 0; i < 30; i += 1) {
      expect(a(0, 1000)).toBe(b(0, 1000));
    }
  });

  it('differs when seed string differs', () => {
    const a = createSeededRandom('seed-one');
    const b = createSeededRandom('seed-two');
    const sa = Array.from({ length: 10 }, () => a(0, 50)).join(',');
    const sb = Array.from({ length: 10 }, () => b(0, 50)).join(',');
    expect(sa).not.toBe(sb);
  });
});

describe('dailyChallengeSeedString', () => {
  it('matches expected pattern', () => {
    expect(dailyChallengeSeedString()).toMatch(/^pokequiz-daily-\d{4}-\d{2}-\d{2}$/);
  });
});
