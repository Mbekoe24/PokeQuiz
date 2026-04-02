import { describe, expect, it } from 'vitest';
import type { GameConfig } from '../../types/game';
import { buildGameSearchParams, parseGameSearchParams } from '.';

const fullConfig: GameConfig = {
  runSeed: 'abc123xyz',
  generationKey: 'gen2',
  difficultyKey: 'hard',
  quizMode: 'type',
  questionCount: 25,
  hardcore: true,
  evolvedOnly: true,
  dailyChallenge: false,
  practice: true,
  hintsEnabled: true,
  japaneseNames: true,
};

describe('buildGameSearchParams / parseGameSearchParams', () => {
  it('round-trips main flags', () => {
    const qs = buildGameSearchParams(fullConfig);
    const parsed = parseGameSearchParams(new URLSearchParams(qs));

    expect(parsed.runSeed).toBe(fullConfig.runSeed);
    expect(parsed.generationKey).toBe(fullConfig.generationKey);
    expect(parsed.difficultyKey).toBe(fullConfig.difficultyKey);
    expect(parsed.quizMode).toBe(fullConfig.quizMode);
    expect(parsed.questionCount).toBe(fullConfig.questionCount);
    expect(parsed.hardcore).toBe(true);
    expect(parsed.evolvedOnly).toBe(true);
    expect(parsed.practice).toBe(true);
    expect(parsed.hintsEnabled).toBe(true);
    expect(parsed.japaneseNames).toBe(true);
    expect(parsed.dailyChallenge).toBe(false);
  });

  it('omits mode when name (default)', () => {
    const qs = buildGameSearchParams({ ...fullConfig, quizMode: 'name' });
    const parsed = parseGameSearchParams(new URLSearchParams(qs));
    expect(parsed.quizMode).toBeUndefined();
    expect(qs.includes('mode=')).toBe(false);
  });
});
