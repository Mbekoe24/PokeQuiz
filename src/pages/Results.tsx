import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ResultsLocationState } from '../types/game';
import { DIFFICULTY, GENERATIONS } from '../utils/generations';
import { clampQuestionCount } from '../utils/questionCount';
import { buildGameSearchParams, getGameShareUrl } from '../utils/gameUrl';

function isResultsState(x: unknown): x is ResultsLocationState {
  if (x == null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.correct === 'number' &&
    typeof o.wrong === 'number' &&
    typeof o.timeouts === 'number' &&
    typeof o.total === 'number'
  );
}

export default function Results() {
  const navigate = useNavigate();
  const { state: rawState } = useLocation();
  const state = isResultsState(rawState) ? rawState : null;
  const [copyMsg, setCopyMsg] = useState('');

  const correct = state?.correct ?? 0;
  const wrong = state?.wrong ?? 0;
  const timeouts = state?.timeouts ?? 0;
  const total = state?.total ?? 10;
  const newBest = Boolean(state?.newBest);
  const generationKey = state?.generationKey;
  const difficultyKey = state?.difficultyKey;
  const gameConfig = state?.gameConfig;
  const hintsUsed = state?.hintsUsed ?? 0;
  const dailyStreakAfter = state?.dailyStreakAfter;
  const quizMode = state?.quizMode ?? 'name';

  useEffect(() => {
    if (state == null) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  const shareQuery = useMemo(() => {
    if (!gameConfig) return '';
    return buildGameSearchParams(gameConfig);
  }, [gameConfig]);

  const shareUrl = useMemo(
    () => (shareQuery ? getGameShareUrl(shareQuery) : ''),
    [shareQuery],
  );

  const summaryText = useMemo(() => {
    const gen =
      generationKey && GENERATIONS[generationKey]
        ? GENERATIONS[generationKey].label
        : '';
    const diff =
      difficultyKey && DIFFICULTY[difficultyKey]
        ? DIFFICULTY[difficultyKey].label
        : '';
    return `PokeQuiz ${correct}/${total} · ${quizMode} mode${gen ? ` · ${gen}` : ''}${diff ? ` · ${diff}` : ''}`;
  }, [correct, total, quizMode, generationKey, difficultyKey]);

  if (state == null) return null;

  const gen =
    generationKey && GENERATIONS[generationKey]
      ? GENERATIONS[generationKey].label
      : '—';
  const diff =
    difficultyKey && DIFFICULTY[difficultyKey]
      ? DIFFICULTY[difficultyKey].label
      : '—';

  const master =
    correct >= 8 ? 'You are a Pokémon Master!' : 'Nice run — keep training!';

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMsg('Link copied!');
    } catch {
      setCopyMsg('Could not copy');
    }
    window.setTimeout(() => setCopyMsg(''), 2500);
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyMsg('Summary copied!');
    } catch {
      setCopyMsg('Could not copy');
    }
    window.setTimeout(() => setCopyMsg(''), 2500);
  };

  const playAgainPath =
    gameConfig && shareQuery
      ? { pathname: '/game' as const, search: `?${shareQuery}` }
      : { pathname: '/game' as const };

  const playAgainState =
    gameConfig && shareQuery
      ? gameConfig
      : {
          generationKey: generationKey ?? 'all',
          difficultyKey: difficultyKey ?? 'medium',
          questionCount: clampQuestionCount(total),
        };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-canvas-surface p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-ink-muted">Run complete</p>
        <h1 className="mt-2 text-4xl font-bold tabular-nums text-ink">
          {correct}/{total}
        </h1>
        <p className="mt-2 text-lg text-ink-muted">correct</p>
        {newBest && (
          <p className="mt-4 inline-block rounded-full border border-accent bg-canvas-elevated px-4 py-1 text-sm font-semibold text-accent">
            New best score
          </p>
        )}
        {typeof dailyStreakAfter === 'number' && dailyStreakAfter > 0 && (
          <p className="mt-3 text-sm font-medium text-brand">
            Daily streak: {dailyStreakAfter} day
            {dailyStreakAfter === 1 ? '' : 's'}
          </p>
        )}
        <p className="mt-4 text-ink">{master}</p>
      </section>

      <section className="rounded-2xl border border-line bg-canvas-surface p-6">
        <h2 className="text-sm font-semibold text-ink-muted">Breakdown</h2>
        <ul className="mt-4 space-y-2 text-ink">
          <li className="flex justify-between border-b border-line/60 pb-2">
            <span>Correct</span>
            <span className="tabular-nums font-semibold text-ok">{correct}</span>
          </li>
          <li className="flex justify-between border-b border-line/60 pb-2">
            <span>Wrong answer</span>
            <span className="tabular-nums font-semibold text-bad">{wrong}</span>
          </li>
          <li className="flex justify-between border-b border-line/60 pb-2">
            <span>Timed out</span>
            <span className="tabular-nums font-semibold text-ink-muted">
              {timeouts}
            </span>
          </li>
          {hintsUsed > 0 && (
            <li className="flex justify-between">
              <span>Hints used</span>
              <span className="tabular-nums font-semibold text-ink-muted">
                {hintsUsed}
              </span>
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs text-ink-muted">
          Settings: {gen} · {diff} · {quizMode}
        </p>

        {shareUrl && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-lg border border-line bg-canvas-elevated px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas-surface"
            >
              Copy challenge link
            </button>
            <button
              type="button"
              onClick={copySummary}
              className="rounded-lg border border-line bg-canvas-elevated px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas-surface"
            >
              Copy score summary
            </button>
            {copyMsg && (
              <span className="self-center text-xs text-ok" role="status">
                {copyMsg}
              </span>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to={playAgainPath}
          state={playAgainState}
          className="inline-flex min-h-[48px] w-full flex-1 touch-manipulation items-center justify-center rounded-xl bg-brand px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:py-3.5"
        >
          Play again
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-[48px] w-full flex-1 touch-manipulation items-center justify-center rounded-xl border border-line bg-canvas-surface px-4 py-3 text-center text-base font-semibold text-ink transition hover:bg-canvas-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:py-3.5"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
