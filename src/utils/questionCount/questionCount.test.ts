import { describe, expect, it } from 'vitest';
import {
  clampQuestionCount,
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
  QUESTION_COUNT_STEP,
} from '.';

describe('clampQuestionCount', () => {
  it('clamps below minimum to minimum snapped to step', () => {
    expect(clampQuestionCount(3)).toBe(QUESTION_COUNT_MIN);
  });

  it('clamps above maximum', () => {
    expect(clampQuestionCount(999)).toBe(QUESTION_COUNT_MAX);
  });

  it('snaps to step', () => {
    expect(clampQuestionCount(12)).toBe(10);
    expect(clampQuestionCount(13)).toBe(15);
    expect(clampQuestionCount(98)).toBe(QUESTION_COUNT_MAX);
  });

  it('uses default for non-finite input', () => {
    expect(clampQuestionCount(Number.NaN)).toBe(DEFAULT_QUESTION_COUNT);
  });

  it('keeps valid stepped values', () => {
    expect(clampQuestionCount(50)).toBe(50);
  });

  it('step is five', () => {
    expect(QUESTION_COUNT_STEP).toBe(5);
  });
});
