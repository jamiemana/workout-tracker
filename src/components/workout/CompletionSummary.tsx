interface CompletionSummaryProps {
  totalVolume: number
  prCount: number
  durationMinutes: number
  onFinish: () => void
  onCancel: () => void
}

export default function CompletionSummary({
  totalVolume,
  prCount,
  durationMinutes,
  onFinish,
  onCancel,
}: CompletionSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border-default bg-bg-secondary p-6 animate-fade-in">
        <h2 className="mb-6 text-center text-xl font-semibold text-text-primary">
          Workout Complete
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-accent-lime">
              {totalVolume.toLocaleString()}
            </p>
            <p className="text-xs text-text-tertiary mt-1">Total Volume (kg)</p>
          </div>

          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-accent-violet">
              {prCount}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              {prCount === 1 ? 'PR Set' : 'PR Sets'}
            </p>
          </div>

          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">
              {durationMinutes}
            </p>
            <p className="text-xs text-text-tertiary mt-1">Minutes</p>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="w-full rounded-lg bg-accent-lime py-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-lime/90"
        >
          Finish Workout
        </button>
        <button
          onClick={onCancel}
          className="mt-2 w-full rounded-lg py-2 text-xs font-medium text-text-muted hover:text-text-secondary"
        >
          Not yet
        </button>
      </div>
    </div>
  )
}
