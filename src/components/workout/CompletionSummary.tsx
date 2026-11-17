import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { MUSCLES, type Muscle } from '@/lib/data/templates'
import { zoneFor, type Zone } from '@/lib/data/volume-landmarks'
import { getWeeklySets } from '@/lib/utils/muscleVolume'
import BodyMap from '@/components/progress/BodyMap'

interface CompletionSummaryProps {
  prCount: number
  durationMinutes: number
  onFinish: () => void
  onCancel: () => void
}

export default function CompletionSummary({
  prCount,
  durationMinutes,
  onFinish,
  onCancel,
}: CompletionSummaryProps) {
  // Last 7 days including the session just logged.
  const weekly = useLiveQuery(() => getWeeklySets(), [])
  const zones = useMemo(() => {
    const z = {} as Record<Muscle, Zone>
    for (const m of MUSCLES) z[m] = zoneFor(m, weekly?.[m] ?? 0)
    return z
  }, [weekly])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg-primary/90 py-4 backdrop-blur-xs">
      <div className="mx-4 my-auto w-full max-w-sm rounded-2xl border border-border-default bg-bg-secondary p-6 animate-fade-in">
        <h2 className="mb-4 text-center text-xl font-semibold text-text-primary">
          Workout Complete
        </h2>

        <BodyMap zones={zones} legend />
        <p className="mt-2 mb-5 text-center text-xs text-text-tertiary">
          Sets per muscle over the last 7 days
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
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
