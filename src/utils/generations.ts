export const GENERATIONS = {
  gen1: { label: 'Gen I', min: 1, max: 151 },
  gen2: { label: 'Gen II', min: 152, max: 251 },
  gen3: { label: 'Gen III', min: 252, max: 386 },
  all: { label: 'All (I–III)', min: 1, max: 386 },
} as const;

export type GenerationKey = keyof typeof GENERATIONS;

export const DIFFICULTY = {
  easy: { label: 'Easy', seconds: 15 },
  medium: { label: 'Medium', seconds: 10 },
  hard: { label: 'Hard', seconds: 5 },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY;

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
