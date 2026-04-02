import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ChoiceGrid from '../components/ChoiceGrid';
import CryPlayer from '../components/CryPlayer';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import TimerRing from '../components/TimerRing';
import type { GameConfig, QuizMode, QuizQuestion, RoundScore } from '../types/game';
import { ALL_POKE_TYPES, buildQuizQuestion } from '../utils/api';
import { parseGameSearchParams } from '../utils/gameUrl';
import { DIFFICULTY, GENERATIONS, shuffle } from '../utils/generations';
import {
  clampQuestionCount,
  DEFAULT_QUESTION_COUNT,
} from '../utils/questionCount';
import { pokemonNamesMatch } from '../utils/pokemonNameGuess';
import {
  createSeededRandom,
  dailyChallengeSeedString,
  randomAlphanumericSeed,
} from '../utils/seededRandom';
import {
  recordDexSeen,
  recordGame,
  updateDailyChallengeStreak,
} from '../utils/storage';

const FEEDBACK_MS_BEFORE_NEXT = 800;
/** When hints are enabled, players get only this many hints for the entire run. */
const MAX_HINTS_PER_RUN = 1;

type Phase = 'question' | 'feedback';

function resolveInitialSeed(
  state: Partial<GameConfig> | undefined,
  searchParams: URLSearchParams,
): string {
  if (state?.runSeed) return state.runSeed;
  const fromUrl = searchParams.get('seed');
  if (fromUrl) return fromUrl;
  const daily =
    Boolean(state?.dailyChallenge) ||
    searchParams.get('daily') === '1' ||
    searchParams.get('daily') === 'true';
  if (daily) return dailyChallengeSeedString();
  return randomAlphanumericSeed();
}

function buildGameConfig(
  state: Partial<GameConfig> | undefined,
  searchParams: URLSearchParams,
  runSeed: string,
): GameConfig {
  const url = parseGameSearchParams(searchParams);
  const s = state ?? {};
  const dailyChallenge = Boolean(s.dailyChallenge) || url.dailyChallenge;
  const rawQuestionCount = dailyChallenge
    ? DEFAULT_QUESTION_COUNT
    : typeof s.questionCount === 'number'
      ? s.questionCount
      : (url.questionCount ?? DEFAULT_QUESTION_COUNT);
  return {
    runSeed,
    generationKey: s.generationKey ?? url.generationKey ?? 'all',
    difficultyKey: s.difficultyKey ?? url.difficultyKey ?? 'medium',
    quizMode: s.quizMode ?? url.quizMode ?? 'name',
    questionCount: clampQuestionCount(rawQuestionCount),
    hardcore: Boolean(s.hardcore) || url.hardcore,
    evolvedOnly: Boolean(s.evolvedOnly) || url.evolvedOnly,
    dailyChallenge,
    practice: Boolean(s.practice) || url.practice,
    hintsEnabled: Boolean(s.hintsEnabled) || url.hintsEnabled,
    japaneseNames: Boolean(s.japaneseNames) || url.japaneseNames,
  };
}

function hintLine(question: QuizQuestion | null, quizMode: QuizMode): string {
  if (!question) return '';
  if (quizMode === 'type') {
    const wrong = ALL_POKE_TYPES.filter((t) => t !== question.primaryType);
    const shuffled = shuffle([...wrong]);
    const pick = shuffled.slice(0, 2);
    return `Not ${pick.join(' or ')}.`;
  }
  const name = question.displayCorrectName ?? question.correctName ?? '';
  const ch = name.charAt(0);
  if (!ch) return '';
  return `Name starts with “${ch.toUpperCase()}”.`;
}

export default function Game() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const locationState = state as Partial<GameConfig> | undefined;
  const [searchParams] = useSearchParams();

  const runSeedRef = useRef<string | null>(null);
  if (runSeedRef.current === null) {
    runSeedRef.current = resolveInitialSeed(locationState, searchParams);
  }

  const gameConfig = useMemo(
    () =>
      buildGameConfig(
        locationState,
        searchParams,
        runSeedRef.current as string,
      ),
    [locationState, searchParams],
  );

  const {
    generationKey,
    difficultyKey,
    quizMode,
    questionCount: totalQuestions,
    hardcore,
    evolvedOnly,
    dailyChallenge,
    practice,
    hintsEnabled,
    japaneseNames,
  } = gameConfig;

  const range =
    generationKey && GENERATIONS[generationKey]
      ? GENERATIONS[generationKey]
      : null;
  const difficulty =
    difficultyKey && DIFFICULTY[difficultyKey] ? DIFFICULTY[difficultyKey] : null;
  const seconds = practice ? Number.POSITIVE_INFINITY : (difficulty?.seconds ?? 10);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('question');
  const [remaining, setRemaining] = useState<number>(difficulty?.seconds ?? 10);
  const [selectedId, setSelectedId] = useState<string | number | null | undefined>(
    undefined,
  );
  const [score, setScore] = useState<RoundScore>({ correct: 0, wrong: 0, timeouts: 0 });
  const [hintsUsedTotal, setHintsUsedTotal] = useState(0);
  const hintsUsedRef = useRef(0);
  const [hintBanner, setHintBanner] = useState('');
  const [hintsExhaustedNotice, setHintsExhaustedNotice] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typedFeedback, setTypedFeedback] = useState<{
    submitted: string;
    correct: boolean;
    timedOut: boolean;
  } | null>(null);
  const typedAnswerRef = useRef('');
  const answeredRef = useRef(false);
  const scoreRef = useRef(score);
  const questionSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    typedAnswerRef.current = typedAnswer;
  }, [typedAnswer]);

  useEffect(() => {
    if (!range || !difficulty) {
      navigate('/', { replace: true });
    }
  }, [range, difficulty, navigate]);

  useEffect(() => {
    if (!range) return undefined;

    const { min, max } = range;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setPhase('question');
      setSelectedId(undefined);
      setHintBanner('');
      setHintsExhaustedNotice(false);
      setTypedAnswer('');
      setTypedFeedback(null);
      answeredRef.current = false;
      const ri = (minN: number, maxN: number) =>
        createSeededRandom(`${runSeedRef.current}:q${questionIndex}`)(minN, maxN);
      try {
        const q = await buildQuizQuestion({
          min,
          max,
          randomIntFn: ri,
          shuffleFn: shuffle,
          mode: quizMode === 'type' ? 'type' : quizMode === 'audio' ? 'audio' : 'name',
          evolvedOnly,
          japaneseNames,
        });
        if (!cancelled) {
          setQuestion(q);
          if (q.correctPokemonId != null) {
            recordDexSeen([q.correctPokemonId]);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [questionIndex, range, retryToken, quizMode, evolvedOnly, japaneseNames]);

  useLayoutEffect(() => {
    if (loading || !question) return;
    const el = questionSectionRef.current;
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: reducedMotion ? 'instant' : 'auto',
    });
  }, [loading, question]);

  const goToResults = useCallback(
    (finalScore: RoundScore) => {
      let dailyStreakAfter: number | undefined;
      if (dailyChallenge && !practice) {
        dailyStreakAfter = updateDailyChallengeStreak({
          dateYmd: new Date().toISOString().slice(0, 10),
        });
      }

      const result = recordGame({
        correct: finalScore.correct,
        total: totalQuestions,
        generationKey,
        difficultyKey,
        practice,
      });

      navigate('/results', {
        replace: true,
        state: {
          ...finalScore,
          total: totalQuestions,
          newBest: result.newBest,
          generationKey,
          difficultyKey,
          gameConfig: { ...gameConfig, runSeed: runSeedRef.current ?? gameConfig.runSeed },
          hintsUsed: hintsUsedRef.current,
          dailyStreakAfter,
          quizMode,
        },
      });
    },
    [
      navigate,
      generationKey,
      difficultyKey,
      practice,
      dailyChallenge,
      gameConfig,
      quizMode,
      totalQuestions,
    ],
  );

  const finishRound = useCallback(
    (pickedId: string | number | null) => {
      if (!question || phase !== 'question' || answeredRef.current) return;
      answeredRef.current = true;

      setPhase('feedback');
      setSelectedId(pickedId === null ? null : pickedId);

      if (pickedId === null && hardcore && quizMode === 'name') {
        setTypedFeedback({
          submitted: typedAnswerRef.current.trim(),
          correct: false,
          timedOut: true,
        });
      }

      const picked = question.choices.find((c) => c.id === pickedId);
      const isCorrect = pickedId !== null && Boolean(picked?.isCorrect);

      const prev = scoreRef.current;
      const nextScore: RoundScore = { ...prev };
      if (pickedId === null) nextScore.timeouts += 1;
      else if (isCorrect) nextScore.correct += 1;
      else nextScore.wrong += 1;
      setScore(nextScore);

      window.setTimeout(() => {
        if (questionIndex >= totalQuestions - 1) {
          goToResults(nextScore);
        } else {
          setQuestionIndex((i) => i + 1);
        }
      }, FEEDBACK_MS_BEFORE_NEXT);
    },
    [question, phase, questionIndex, goToResults, totalQuestions, hardcore, quizMode],
  );

  const submitTypedName = useCallback(() => {
    if (!question || phase !== 'question' || answeredRef.current) return;
    if (!hardcore || quizMode !== 'name') return;
    const raw = typedAnswer.trim();
    if (!raw) return;

    answeredRef.current = true;
    setPhase('feedback');
    setSelectedId(null);

    const expected = question.displayCorrectName ?? question.correctName ?? '';
    const isCorrect = pokemonNamesMatch(raw, expected);
    setTypedFeedback({ submitted: raw, correct: isCorrect, timedOut: false });

    const prev = scoreRef.current;
    const nextScore: RoundScore = { ...prev };
    if (isCorrect) nextScore.correct += 1;
    else nextScore.wrong += 1;
    setScore(nextScore);

    window.setTimeout(() => {
      if (questionIndex >= totalQuestions - 1) {
        goToResults(nextScore);
      } else {
        setQuestionIndex((i) => i + 1);
      }
    }, FEEDBACK_MS_BEFORE_NEXT);
  }, [
    question,
    phase,
    hardcore,
    quizMode,
    typedAnswer,
    questionIndex,
    goToResults,
    totalQuestions,
  ]);

  useEffect(() => {
    if (practice || !Number.isFinite(seconds)) return undefined;
    if (phase !== 'question' || loading || !question) return undefined;

    setRemaining(seconds);
    let left = seconds;
    const id = window.setInterval(() => {
      left -= 1;
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(id);
        finishRound(null);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [practice, seconds, phase, loading, question, questionIndex, finishRound]);

  useEffect(() => {
    if (phase !== 'question' || loading || !question) return undefined;

    const onKey = (e: KeyboardEvent) => {
      if (hardcore && quizMode === 'name') return;
      const t = e.target;
      if (t instanceof Node && (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) {
        return;
      }
      const key = e.key.toLowerCase();
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      const idx = map[key];
      if (idx === undefined) return;
      const choice = question.choices[idx];
      if (choice) finishRound(choice.id);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, loading, question, finishRound, hardcore, quizMode]);

  const handleChoose = (id: string | number) => {
    if (phase !== 'question' || loading || !question) return;
    finishRound(id);
  };

  const onHintButtonClick = () => {
    if (!hintsEnabled || !question || phase !== 'question') return;
    if (hintsUsedRef.current >= MAX_HINTS_PER_RUN) {
      setHintsExhaustedNotice(true);
      return;
    }
    hintsUsedRef.current += 1;
    setHintsUsedTotal(hintsUsedRef.current);
    setHintBanner(hintLine(question, quizMode));
  };

  const hintsLeft = hintsUsedTotal < MAX_HINTS_PER_RUN;

  if (!range) return null;

  const showAnswer = phase === 'feedback';
  const completedSegments = questionIndex;
  const useSilhouette = !hardcore;
  const hardcoreNameMode = hardcore && quizMode === 'name';

  const titleText =
    quizMode === 'type'
      ? 'What type is this Pokémon?'
      : quizMode === 'audio'
        ? 'Who’s this Pokémon? (listen to the cry)'
        : 'Who’s this Pokémon?';

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link
          to="/"
          className="order-first mr-auto inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 rounded-lg border border-line bg-canvas-elevated px-3 py-2 text-sm font-medium text-ink transition hover:border-accent/50 hover:bg-canvas-surface hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden>←</span>
          Back to home
        </Link>
        {practice && (
          <span className="rounded-full bg-accent/20 px-2 py-1 font-semibold text-accent-muted">
            Practice
          </span>
        )}
        {dailyChallenge && (
          <span className="rounded-full bg-brand/15 px-2 py-1 font-semibold text-brand">
            Daily challenge
          </span>
        )}
        {quizMode !== 'name' && (
          <span className="rounded-full border border-line px-2 py-1 text-ink-muted">
            Mode: {quizMode}
          </span>
        )}
        {hardcore && (
          <span className="rounded-full border border-line px-2 py-1 text-ink-muted">
            {quizMode === 'name' ? 'Hardcore (type the name)' : 'Hardcore (no silhouette)'}
          </span>
        )}
        {evolvedOnly && (
          <span className="rounded-full border border-line px-2 py-1 text-ink-muted">
            Evolved only
          </span>
        )}
        {japaneseNames && (
          <span className="rounded-full border border-line px-2 py-1 text-ink-muted">
            Japanese names
          </span>
        )}
        <span className="rounded-full border border-line px-2 py-1 text-ink-muted">
          {totalQuestions} rounds
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink-muted">
            Question{' '}
            <span className="font-semibold text-ink">{questionIndex + 1}</span>{' '}
            / {totalQuestions}
          </p>
          <p className="text-sm text-ink-muted">
            Score{' '}
            <span className="font-semibold text-ink">{score.correct}</span> correct
            {hintsUsedTotal > 0 && (
              <span className="text-ink-muted"> · {hintsUsedTotal} hint used</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TimerRing
            remaining={remaining}
            total={Number.isFinite(seconds) ? seconds : 1}
            practice={practice}
          />
        </div>
      </div>

      <ProgressBar completed={completedSegments} total={totalQuestions} />

      {error && (
        <div
          className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="ml-3 font-medium underline decoration-bad hover:text-ink"
            onClick={() => {
              setError('');
              setRetryToken((t) => t + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div
          className="flex min-h-[280px] items-center justify-center rounded-2xl border border-line bg-canvas-surface p-12 shadow-inner"
          aria-busy="true"
        >
          <p className="text-center text-sm font-medium text-ink-muted" role="status" aria-live="polite">
            Loading next Pokémon…
          </p>
        </div>
      )}

      {!loading && question && (
        <div
          ref={questionSectionRef}
          className="scroll-mt-28 space-y-6 transition-opacity duration-300"
        >
          <QuestionCard
            artworkUrl={question.artworkUrl}
            revealed={showAnswer}
            name={question.displayCorrectName ?? question.correctName}
            useSilhouette={useSilhouette}
          />
          {quizMode === 'audio' && question.cryUrl && (
            <CryPlayer cryUrl={question.cryUrl} disabled={showAnswer} />
          )}
          <h2 className="text-center text-lg font-semibold text-ink">
            {hardcoreNameMode ? 'Type this Pokémon’s name' : titleText}
          </h2>
          {hardcoreNameMode && phase === 'question' && (
            <p className="text-center text-xs text-ink-muted">
              Type the full name (not case-sensitive) and submit before the timer runs out.
            </p>
          )}
          {hintBanner && (
            <p
              className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-center text-sm text-ink"
              role="status"
            >
              <span className="font-semibold text-accent-muted">Hint: </span>
              {hintBanner}
            </p>
          )}
          {hintsEnabled && phase === 'question' && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onHintButtonClick}
                aria-disabled={!hintsLeft}
                className={
                  hintsLeft
                    ? 'text-sm font-medium text-brand underline decoration-brand/50 hover:text-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                    : 'cursor-not-allowed text-sm font-medium text-ink-muted no-underline opacity-55 hover:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line'
                }
              >
                {hintsLeft ? 'Use your only hint (soft clue)' : 'No hints left'}
              </button>
              {hintsExhaustedNotice && (
                <p
                  className="max-w-md rounded-lg border border-line bg-canvas-elevated px-3 py-2 text-center text-sm leading-relaxed text-ink-muted"
                  role="status"
                  aria-live="polite"
                >
                  <span className="font-semibold text-ink">All hints used up.</span> No more clues
                  this run—you&apos;re on your own from here!
                </p>
              )}
            </div>
          )}
          {!hardcoreNameMode && (
            <p className="-mt-2 text-center text-xs text-ink-muted">
              Keys 1–4 or A–D
            </p>
          )}
          {typedFeedback && showAnswer && hardcoreNameMode && (
            <p
              className="text-center text-sm text-ink-muted"
              role="status"
            >
              {typedFeedback.timedOut
                ? typedFeedback.submitted
                  ? `Time’s up — you had “${typedFeedback.submitted}” typed.`
                  : 'Time’s up.'
                : typedFeedback.correct
                  ? `Correct — “${typedFeedback.submitted}” matches.`
                  : `Not quite — you entered “${typedFeedback.submitted}”.`}
            </p>
          )}
          {hardcoreNameMode && phase === 'question' && (
            <form
              className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-stretch"
              onSubmit={(e) => {
                e.preventDefault();
                submitTypedName();
              }}
            >
              <label className="sr-only" htmlFor="hardcore-name-input">
                Pokémon name
              </label>
              <input
                id="hardcore-name-input"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={typedAnswer}
                disabled={showAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="e.g. Pikachu"
                className="min-h-[48px] flex-1 rounded-xl border-2 border-line bg-canvas-surface px-4 py-3 text-ink shadow-inner placeholder:text-ink-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={showAnswer || !typedAnswer.trim()}
                className="min-h-[48px] shrink-0 rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit
              </button>
            </form>
          )}
          {!hardcoreNameMode && (
            <ChoiceGrid
              choices={question.choices}
              disabled={showAnswer}
              selectedId={selectedId}
              showAnswer={showAnswer}
              onChoose={handleChoose}
            />
          )}
        </div>
      )}
    </div>
  );
}
