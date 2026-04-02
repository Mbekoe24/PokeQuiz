interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Question progress, ${completed} of ${total} complete`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 min-w-0 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
            i < completed ? 'bg-accent' : 'bg-canvas-elevated'
          }`}
        />
      ))}
    </div>
  );
}
