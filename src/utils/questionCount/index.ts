export const QUESTION_COUNT_MIN = 10;
export const QUESTION_COUNT_MAX = 100;
export const DEFAULT_QUESTION_COUNT = 10;
/** Slider / allowed values step (10, 15, 20 … 100). */
export const QUESTION_COUNT_STEP = 5;

export function clampQuestionCount(n: number): number {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return DEFAULT_QUESTION_COUNT;
  let v = Math.min(QUESTION_COUNT_MAX, Math.max(QUESTION_COUNT_MIN, x));
  v = Math.round(v / QUESTION_COUNT_STEP) * QUESTION_COUNT_STEP;
  return Math.min(QUESTION_COUNT_MAX, Math.max(QUESTION_COUNT_MIN, v));
}
