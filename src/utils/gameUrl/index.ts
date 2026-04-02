import {
  DIFFICULTY,
  GENERATIONS,
  type DifficultyKey,
  type GenerationKey,
} from '../generations';
import type { GameConfig, QuizMode } from '../../types/game';
import {
  clampQuestionCount,
  DEFAULT_QUESTION_COUNT,
} from '../questionCount';

const BOOL = (v: string | null): boolean => v === '1' || v === 'true';

export interface ParsedGameSearchParams {
  runSeed: string | undefined;
  generationKey: GenerationKey | undefined;
  difficultyKey: DifficultyKey | undefined;
  quizMode: QuizMode | undefined;
  questionCount: number | undefined;
  hardcore: boolean;
  evolvedOnly: boolean;
  dailyChallenge: boolean;
  practice: boolean;
  hintsEnabled: boolean;
  japaneseNames: boolean;
}

export function parseGameSearchParams(searchParams: URLSearchParams): ParsedGameSearchParams {
  const gen = searchParams.get('gen');
  const diff = searchParams.get('diff');
  const mode = searchParams.get('mode');
  const roundsRaw = searchParams.get('rounds');
  let questionCount: number | undefined;
  if (roundsRaw != null && roundsRaw !== '') {
    const n = Number.parseInt(roundsRaw, 10);
    if (Number.isFinite(n)) questionCount = clampQuestionCount(n);
  }
  return {
    runSeed: searchParams.get('seed') ?? undefined,
    generationKey:
      gen != null && gen in GENERATIONS ? (gen as GenerationKey) : undefined,
    difficultyKey:
      diff != null && diff in DIFFICULTY ? (diff as DifficultyKey) : undefined,
    quizMode:
      mode === 'type' || mode === 'audio' || mode === 'name' ? mode : undefined,
    questionCount,
    hardcore: BOOL(searchParams.get('hard')),
    evolvedOnly: BOOL(searchParams.get('evo')),
    dailyChallenge: BOOL(searchParams.get('daily')),
    practice: BOOL(searchParams.get('practice')),
    hintsEnabled: BOOL(searchParams.get('hint')),
    japaneseNames: BOOL(searchParams.get('ja')),
  };
}

export function buildGameSearchParams(cfg: Partial<GameConfig>): string {
  const p = new URLSearchParams();
  if (cfg.runSeed) p.set('seed', String(cfg.runSeed));
  if (cfg.generationKey) p.set('gen', String(cfg.generationKey));
  if (cfg.difficultyKey) p.set('diff', String(cfg.difficultyKey));
  if (cfg.quizMode && cfg.quizMode !== 'name') p.set('mode', String(cfg.quizMode));
  if (cfg.hardcore) p.set('hard', '1');
  if (cfg.evolvedOnly) p.set('evo', '1');
  if (cfg.dailyChallenge) p.set('daily', '1');
  if (cfg.practice) p.set('practice', '1');
  if (cfg.hintsEnabled) p.set('hint', '1');
  if (cfg.japaneseNames) p.set('ja', '1');
  if (
    cfg.questionCount != null &&
    cfg.questionCount !== DEFAULT_QUESTION_COUNT
  ) {
    p.set('rounds', String(cfg.questionCount));
  }
  return p.toString();
}

/** Absolute URL to /game with query (for sharing). Best-effort for SPA base paths. */
export function getGameShareUrl(queryString: string): string {
  if (typeof window === 'undefined') return '';
  const q = queryString.replace(/^\?/, '');
  const { origin, pathname } = window.location;
  let dir = pathname;
  if (dir.endsWith('.html')) {
    dir = dir.slice(0, dir.lastIndexOf('/') + 1);
  }
  if (!dir.endsWith('/')) dir += '/';
  return `${origin}${dir}game?${q}`;
}
