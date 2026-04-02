import type { DifficultyKey, GenerationKey } from '../utils/generations';

export type QuizMode = 'name' | 'type' | 'audio';

/** Full config for a run (navigation state + URL serialization). */
export interface GameConfig {
  runSeed: string;
  generationKey: GenerationKey;
  difficultyKey: DifficultyKey;
  quizMode: QuizMode;
  /** Number of rounds in this run (10–100). Daily challenge always uses 10. */
  questionCount: number;
  hardcore: boolean;
  evolvedOnly: boolean;
  dailyChallenge: boolean;
  practice: boolean;
  hintsEnabled: boolean;
  japaneseNames: boolean;
}

export interface QuizChoice {
  id: string | number;
  name: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  kind: QuizMode;
  correctPokemonId: number;
  correctName: string;
  displayCorrectName?: string;
  artworkUrl: string;
  cryUrl: string;
  primaryType: string;
  choices: QuizChoice[];
}

export interface RoundScore {
  correct: number;
  wrong: number;
  timeouts: number;
}

/** `react-router` location.state for `/results`. */
export interface ResultsLocationState extends RoundScore {
  total: number;
  newBest: boolean;
  generationKey?: GenerationKey;
  difficultyKey?: DifficultyKey;
  gameConfig?: GameConfig;
  hintsUsed?: number;
  dailyStreakAfter?: number;
  quizMode?: QuizMode;
}

/** `react-router` location.state for `/game` (may be partial from old links). */
export type GameLocationState = Partial<GameConfig> | undefined;

export interface RecentScoreEntry {
  correct: number;
  total: number;
  playedAt: string;
  generationKey?: GenerationKey;
  difficultyKey?: DifficultyKey;
}
