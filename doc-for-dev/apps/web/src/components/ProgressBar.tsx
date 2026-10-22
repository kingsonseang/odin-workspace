import type { ProgressDto } from "@forgeboard/shared";

interface ProgressBarProps {
  progress: ProgressDto;
  compact?: boolean;
}

export function ProgressBar({ progress, compact = false }: ProgressBarProps) {
  return (
    <div className={`progress ${compact ? "progress--compact" : ""}`}>
      <div className="progress__meta">
        <span className="progress__percent">{progress.percent}%</span>
        {!compact && (
          <span className="progress__points">
            {progress.completedPoints} of {progress.totalPoints} effort points
          </span>
        )}
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-label="Project progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <span
          className="progress__fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
