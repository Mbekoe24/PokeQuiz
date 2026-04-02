import type { QuizChoice } from '../types/game';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

interface ChoiceGridProps {
  choices: QuizChoice[];
  disabled: boolean;
  selectedId: string | number | null | undefined;
  showAnswer: boolean;
  onChoose: (id: string | number) => void;
}

export default function ChoiceGrid({
  choices,
  disabled,
  selectedId,
  showAnswer,
  onChoose,
}: ChoiceGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {choices.map((c, i) => {
        const letter = LETTERS[i] ?? '?';
        const isSelected = selectedId != null && selectedId === c.id;
        const isCorrect = Boolean(c.isCorrect);

        let cls =
          'border-line bg-canvas-surface hover:bg-canvas-elevated focus-visible:outline-accent';
        if (showAnswer) {
          if (isCorrect) {
            cls =
              'border-ok bg-ok/15 border-l-4 border-l-ok pl-[calc(0.75rem-4px)] sm:pl-[calc(1rem-4px)]';
          } else if (isSelected) {
            cls =
              'border-bad bg-bad/15 border-l-4 border-l-bad pl-[calc(0.75rem-4px)] sm:pl-[calc(1rem-4px)]';
          } else cls = 'border-line opacity-60';
        } else if (isSelected) cls = 'border-accent bg-canvas-elevated';

        return (
          <button
            key={String(c.id)}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(c.id)}
            aria-pressed={isSelected}
            className={`flex min-h-[48px] touch-manipulation items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-transform duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${cls}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas-elevated text-sm font-bold text-accent">
              {letter}
            </span>
            <span className="font-medium text-ink">{c.name}</span>
            {showAnswer && isCorrect && (
              <span className="ml-auto text-ok" title="Correct">
                ✓
              </span>
            )}
            {showAnswer && isSelected && !isCorrect && (
              <span className="ml-auto text-bad" title="Incorrect">
                ✗
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
