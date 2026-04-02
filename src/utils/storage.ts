import type { DifficultyKey, GenerationKey } from './generations';
import type { RecentScoreEntry } from '../types/game';

const STATS_KEY = 'pokequiz-stats';
const DEX_KEY = 'pokequiz-dex-seen';
const DAILY_KEY = 'pokequiz-daily-streak';
const RECENT_LIMIT = 5;

export interface StatsSnapshot {
  /** Best run: correct answers (paired with highScoreTotal). */
  highScore: number;
  /** Total questions in the run that set `highScore` (for fair comparison across lengths). */
  highScoreTotal: number;
  gamesPlayed: number;
  lastCorrect: number | null;
  lastTotal: number | null;
  recentScores: RecentScoreEntry[];
}

function runImproved(correct: number, total: number, prevCorrect: number, prevTotal: number): boolean {
  if (total < 1 || prevTotal < 1) return correct > prevCorrect;
  return correct * prevTotal > prevCorrect * total;
}

export function loadDexSeen(): Set<number> {
  try {
    const raw = localStorage.getItem(DEX_KEY);
    const arr: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((n): n is number => typeof n === 'number'));
  } catch {
    return new Set();
  }
}

export function recordDexSeen(pokemonIds: number[]): number {
  const cur = loadDexSeen();
  for (const id of pokemonIds) {
    if (typeof id === 'number') cur.add(id);
  }
  localStorage.setItem(DEX_KEY, JSON.stringify([...cur].sort((a, b) => a - b)));
  return cur.size;
}

export interface DailyStreakState {
  lastDate: string | null;
  streak: number;
}

export function loadDailyStreak(): DailyStreakState {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return { lastDate: null, streak: 0 };
    const p = JSON.parse(raw) as { lastDate?: string; streak?: number };
    return {
      lastDate: p.lastDate ?? null,
      streak: Math.max(0, p.streak ?? 0),
    };
  } catch {
    return { lastDate: null, streak: 0 };
  }
}

export function updateDailyChallengeStreak({ dateYmd }: { dateYmd: string }): number {
  const prev = loadDailyStreak();
  if (prev.lastDate === dateYmd) {
    return prev.streak;
  }
  const yesterday = new Date(`${dateYmd}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  let nextStreak = 1;
  if (prev.lastDate === yStr) {
    nextStreak = prev.streak + 1;
  }
  const next = { lastDate: dateYmd, streak: nextStreak };
  localStorage.setItem(DAILY_KEY, JSON.stringify(next));
  return nextStreak;
}

const emptyStats = (): StatsSnapshot => ({
  highScore: 0,
  highScoreTotal: 10,
  gamesPlayed: 0,
  lastCorrect: null,
  lastTotal: null,
  recentScores: [],
});

export function loadStats(): StatsSnapshot {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    const p = JSON.parse(raw) as {
      highScore?: unknown;
      highScoreTotal?: unknown;
      gamesPlayed?: unknown;
      lastCorrect?: unknown;
      lastTotal?: unknown;
      recentScores?: unknown;
    };
    const recent = Array.isArray(p.recentScores) ? p.recentScores : [];

    const highScore = typeof p.highScore === 'number' ? p.highScore : 0;
    const highScoreTotal =
      typeof p.highScoreTotal === 'number' && p.highScoreTotal >= 1
        ? p.highScoreTotal
        : 10;

    return {
      highScore,
      highScoreTotal,
      gamesPlayed: typeof p.gamesPlayed === 'number' ? p.gamesPlayed : 0,
      lastCorrect: typeof p.lastCorrect === 'number' ? p.lastCorrect : null,
      lastTotal: typeof p.lastTotal === 'number' ? p.lastTotal : null,
      recentScores: recent
        .filter(
          (r): r is RecentScoreEntry =>
            r != null &&
            typeof r === 'object' &&
            'correct' in r &&
            'total' in r &&
            'playedAt' in r &&
            typeof (r as RecentScoreEntry).correct === 'number' &&
            typeof (r as RecentScoreEntry).total === 'number' &&
            typeof (r as RecentScoreEntry).playedAt === 'string',
        )
        .slice(0, RECENT_LIMIT),
    };
  } catch {
    return emptyStats();
  }
}

export interface RecordGameInput {
  correct: number;
  total: number;
  generationKey?: GenerationKey;
  difficultyKey?: DifficultyKey;
  practice?: boolean;
}

export type RecordGameResult = StatsSnapshot & { newBest: boolean };

export function recordGame({
  correct,
  total,
  generationKey,
  difficultyKey,
  practice,
}: RecordGameInput): RecordGameResult {
  if (practice) {
    return {
      ...loadStats(),
      newBest: false,
    };
  }

  const prev = loadStats();
  const prevHigh = prev.highScore ?? 0;
  const prevHighTotal = prev.highScoreTotal ?? 10;

  const entry: RecentScoreEntry = {
    correct,
    total,
    playedAt: new Date().toISOString(),
    ...(generationKey != null ? { generationKey } : {}),
    ...(difficultyKey != null ? { difficultyKey } : {}),
  };

  const recentScores = [entry, ...(prev.recentScores ?? [])].slice(0, RECENT_LIMIT);

  const improved = runImproved(correct, total, prevHigh, prevHighTotal);
  const next: StatsSnapshot = {
    highScore: improved ? correct : prevHigh,
    highScoreTotal: improved ? total : prevHighTotal,
    gamesPlayed: (prev.gamesPlayed ?? 0) + 1,
    lastCorrect: correct,
    lastTotal: total,
    recentScores,
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(next));
  return { ...next, newBest: improved };
}
