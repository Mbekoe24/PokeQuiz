import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingMonsStrip, HeroPikachu } from '../components/HomeHeroDecor';
import PokemonFactCard from '../components/PokemonFactCard';
import type { GameConfig, QuizMode } from '../types/game';
import { DIFFICULTY, GENERATIONS, type DifficultyKey, type GenerationKey } from '../utils/generations';
import { buildGameSearchParams } from '../utils/gameUrl';
import { dailyChallengeSeedString, randomAlphanumericSeed } from '../utils/seededRandom';
import {
  clampQuestionCount,
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
  QUESTION_COUNT_STEP,
} from '../utils/questionCount';
import { loadDexSeen, loadStats } from '../utils/storage';

function dexInRange(seen: Set<number>, min: number, max: number) {
  let n = 0;
  for (let id = min; id <= max; id += 1) {
    if (seen.has(id)) n += 1;
  }
  return { seen: n, total: max - min + 1 };
}

const QUIZ_MODES: { key: QuizMode; label: string }[] = [
  { key: 'name', label: 'Name (silhouette)' },
  { key: 'type', label: 'Type' },
  { key: 'audio', label: 'Cry' },
];

export default function Home() {
  const navigate = useNavigate();
  const [genKey, setGenKey] = useState<GenerationKey>('all');
  const [diffKey, setDiffKey] = useState<DifficultyKey>('medium');
  const [quizMode, setQuizMode] = useState<QuizMode>('name');
  const [hardcore, setHardcore] = useState(false);
  const [evolvedOnly, setEvolvedOnly] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState(false);
  const [practice, setPractice] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [japaneseNames, setJapaneseNames] = useState(false);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  /** Lets users type multi-digit values before clamp snaps on blur. */
  const [roundsDraft, setRoundsDraft] = useState<string | null>(null);

  useEffect(() => {
    if (dailyChallenge) {
      setQuestionCount(DEFAULT_QUESTION_COUNT);
      setRoundsDraft(null);
    }
  }, [dailyChallenge]);

  const stats = useMemo(() => loadStats(), []);
  const dexSeen = useMemo(() => loadDexSeen(), []);
  const gen = GENERATIONS[genKey];

  const dexProgress = useMemo(
    () => dexInRange(dexSeen, gen.min, gen.max),
    [dexSeen, gen],
  );

  const start = () => {
    const runSeed = dailyChallenge
      ? dailyChallengeSeedString()
      : randomAlphanumericSeed();

    const qc = dailyChallenge ? DEFAULT_QUESTION_COUNT : clampQuestionCount(questionCount);
    const gameConfig: GameConfig = {
      runSeed,
      generationKey: genKey,
      difficultyKey: diffKey,
      quizMode,
      questionCount: qc,
      hardcore,
      evolvedOnly,
      dailyChallenge,
      practice,
      hintsEnabled,
      japaneseNames,
    };

    const search = buildGameSearchParams(gameConfig);
    navigate(
      {
        pathname: '/game',
        search: search ? `?${search}` : '',
      },
      { state: gameConfig },
    );
  };

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand/15 via-canvas-surface to-accent/10 p-6 shadow-lg sm:p-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl motion-reduce:blur-none"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              PokeQuiz
            </p>
            <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Guess Pokémon by silhouette, type, or cry
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              You get <strong className="text-ink">10–100 rounds</strong> in steps of {QUESTION_COUNT_STEP}{' '}
              (your choice)
              and <strong className="text-ink">four choices</strong> each time—official
              artwork from PokéAPI, optional timers, and modes like{' '}
              <strong className="text-ink">daily challenge</strong>,{' '}
              <strong className="text-ink">type quiz</strong>, and{' '}
              <strong className="text-ink">listen to the cry</strong>. Tune
              difficulty and generation, chase your high score, and share a link so
              friends play the <em>same</em> random quiz.
            </p>
            <FloatingMonsStrip />
          </div>
          <HeroPikachu className="mx-auto lg:mx-0" />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-canvas-surface p-6">
        <h2 className="text-sm font-semibold text-ink-muted">Questions per quiz</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Pick how many Pokémon you want per run—increments of {QUESTION_COUNT_STEP} (daily challenge stays
          at {DEFAULT_QUESTION_COUNT}).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            type="range"
            min={QUESTION_COUNT_MIN}
            max={QUESTION_COUNT_MAX}
            step={QUESTION_COUNT_STEP}
            value={dailyChallenge ? DEFAULT_QUESTION_COUNT : questionCount}
            disabled={dailyChallenge}
            onChange={(e) => {
              setRoundsDraft(null);
              setQuestionCount(clampQuestionCount(Number.parseInt(e.target.value, 10)));
            }}
            className="h-2 min-w-[min(100%,220px)] flex-1 cursor-pointer accent-brand disabled:cursor-not-allowed disabled:opacity-50"
            aria-valuemin={QUESTION_COUNT_MIN}
            aria-valuemax={QUESTION_COUNT_MAX}
            aria-valuenow={dailyChallenge ? DEFAULT_QUESTION_COUNT : questionCount}
            aria-label="Number of questions"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <span className="text-ink-muted">Rounds</span>
            <input
              type="number"
              min={QUESTION_COUNT_MIN}
              max={QUESTION_COUNT_MAX}
              step={QUESTION_COUNT_STEP}
              value={
                dailyChallenge
                  ? String(DEFAULT_QUESTION_COUNT)
                  : roundsDraft !== null
                    ? roundsDraft
                    : String(questionCount)
              }
              disabled={dailyChallenge}
              onFocus={() => {
                if (!dailyChallenge) setRoundsDraft(String(questionCount));
              }}
              onChange={(e) => {
                if (dailyChallenge) return;
                setRoundsDraft(e.target.value);
              }}
              onBlur={() => {
                if (dailyChallenge) return;
                const n = Number.parseInt(roundsDraft ?? '', 10);
                if (Number.isFinite(n)) setQuestionCount(clampQuestionCount(n));
                setRoundsDraft(null);
              }}
              className="w-16 rounded-lg border border-line bg-canvas-elevated px-2 py-1 text-center font-semibold tabular-nums text-ink disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-canvas-surface p-6">
          <h2 className="text-sm font-semibold text-ink-muted">Generation</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.entries(GENERATIONS) as [GenerationKey, { label: string }][]).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGenKey(key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  genKey === key
                    ? 'border-accent bg-canvas-elevated text-ink'
                    : 'border-line text-ink-muted hover:border-accent/50 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Dex in this range:{' '}
            <span className="font-semibold text-ink">
              {dexProgress.seen}/{dexProgress.total}
            </span>{' '}
            species spotted in your quizzes
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-canvas-surface p-6">
          <h2 className="text-sm font-semibold text-ink-muted">Difficulty</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Timer per question (skipped in Practice).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.entries(DIFFICULTY) as [DifficultyKey, { label: string }][]).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDiffKey(key)}
                disabled={practice}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${
                  diffKey === key
                    ? 'border-accent bg-canvas-elevated text-ink'
                    : 'border-line text-ink-muted hover:border-accent/50 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <PokemonFactCard className="md:col-span-2 lg:col-span-1" />
      </section>

      <section className="rounded-2xl border border-line bg-canvas-surface p-6">
        <h2 className="text-sm font-semibold text-ink-muted">Quiz mode</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUIZ_MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setQuizMode(key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                quizMode === key
                  ? 'border-accent bg-canvas-elevated text-ink'
                  : 'border-line text-ink-muted hover:border-accent/50 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas-elevated/50 p-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-line"
              checked={hardcore}
              onChange={(e) => setHardcore(e.target.checked)}
            />
            <span>
              <span className="font-medium text-ink">Hardcore</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {quizMode === 'name'
                  ? 'Full-color art—no silhouette. You type out the Pokémon’s full name before the timer runs out; matches are not case-sensitive. Type and Cry modes still use four choices.'
                  : 'Full-color artwork—no silhouette hiding. In Name mode you type out the answer; here you still pick from four choices.'}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas-elevated/50 p-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-line"
              checked={evolvedOnly}
              onChange={(e) => setEvolvedOnly(e.target.checked)}
            />
            <span>
              <span className="font-medium text-ink">Evolved only</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Only Pokémon that evolve from another species.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas-elevated/50 p-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-line"
              checked={dailyChallenge}
              onChange={(e) => {
                setDailyChallenge(e.target.checked);
                if (e.target.checked) setPractice(false);
              }}
            />
            <span>
              <span className="font-medium text-ink">Daily challenge</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Same quiz as everyone else today. Builds a streak.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas-elevated/50 p-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-line"
              checked={practice}
              onChange={(e) => {
                setPractice(e.target.checked);
                if (e.target.checked) {
                  setDailyChallenge(false);
                }
              }}
            />
            <span>
              <span className="font-medium text-ink">Practice</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                No timer; scores don&apos;t update your records.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas-elevated/50 p-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-line"
              checked={hintsEnabled}
              onChange={(e) => setHintsEnabled(e.target.checked)}
            />
            <span>
              <span className="font-medium text-ink">Hints</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                One soft clue for the whole run (first letter or “not these types”).
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas-elevated/50 p-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-line"
              checked={japaneseNames}
              onChange={(e) => setJapaneseNames(e.target.checked)}
            />
            <span>
              <span className="font-medium text-ink">Japanese names</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Choices use Japanese names where available.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-canvas-elevated/80 p-6">
        <h2 className="text-sm font-semibold text-ink-muted">Stats</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-muted">Best score</dt>
            <dd className="text-2xl font-bold tabular-nums text-ink">
              {stats.highScore}/{stats.highScoreTotal ?? 10}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Games played</dt>
            <dd className="text-2xl font-bold tabular-nums text-ink">
              {stats.gamesPlayed}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Last run</dt>
            <dd className="text-2xl font-bold tabular-nums text-ink">
              {stats.lastCorrect != null
                ? `${stats.lastCorrect}/${stats.lastTotal ?? 10}`
                : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-ink-muted">Recent games</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Your last five finished quizzes, newest first.
          </p>
          {!stats.recentScores?.length ? (
            <p className="mt-3 text-sm text-ink-muted">
              Finish a quiz to build your history here.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {stats.recentScores.map((run, i) => {
                const runGen =
                  run.generationKey &&
                  GENERATIONS[run.generationKey]?.label;
                const runDiff =
                  run.difficultyKey &&
                  DIFFICULTY[run.difficultyKey]?.label;
                const when = new Date(run.playedAt);
                const dateLabel = Number.isNaN(when.getTime())
                  ? ''
                  : when.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                const settings =
                  runGen && runDiff ? `${runGen} · ${runDiff}` : runGen || runDiff || '';

                return (
                  <li
                    key={`${run.playedAt}-${i}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-canvas-surface px-3 py-2 text-sm"
                  >
                    <span className="font-semibold tabular-nums text-ink">
                      {run.correct}/{run.total}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {[dateLabel, settings].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-ink-muted sm:max-w-[60%]">
          {gen.label} ·{' '}
          {dailyChallenge ? DEFAULT_QUESTION_COUNT : questionCount} rounds ·{' '}
          {practice ? 'No timer' : `${DIFFICULTY[diffKey].seconds}s`}
          {dailyChallenge && ' · Daily'} · {quizMode}
        </p>
        <button
          type="button"
          onClick={start}
          className="min-h-[48px] w-full touch-manipulation rounded-xl bg-brand px-8 py-3 text-center text-base font-semibold text-white shadow-md transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:shrink-0"
        >
          Start quiz
        </button>
      </div>
    </div>
  );
}
