import { MUSCLE_LABELS, type Muscle } from '@/lib/data/templates'
import {
  LANDMARKS,
  ZONE_COLORS,
  ZONE_LABELS,
  zoneFor,
  zoneForSegment,
} from '@/lib/data/volume-landmarks'

interface ZoneBarProps {
  muscle: Muscle
  sets: number
  /** Optional caption under the bar, e.g. "plan 14 per cycle". */
  caption?: string
  showMuscle?: boolean
}

export default function ZoneBar({ muscle, sets, caption, showMuscle = true }: ZoneBarProps) {
  const { max } = LANDMARKS[muscle]
  const zone = zoneFor(muscle, sets)
  const filled = Math.round(sets * 2) / 2
  const display = Number.isInteger(filled) ? `${filled}` : filled.toFixed(1)
  const segments = Math.max(max, Math.ceil(filled))

  return (
    <div>
      {showMuscle && (
        <p className="text-sm font-medium text-text-primary">{MUSCLE_LABELS[muscle]}</p>
      )}
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-text-tertiary">
          <span className="font-mono text-base font-semibold text-text-primary">{display} sets</span>{' '}
          of {max} weekly max
        </p>
        <span className="text-xs font-medium" style={{ color: zone === 'none' ? '#666666' : ZONE_COLORS[zone] }}>
          {ZONE_LABELS[zone]}
        </span>
      </div>
      <div className="mt-1.5 flex gap-[3px]" aria-hidden>
        {Array.from({ length: segments }, (_, i) => {
          const n = i + 1
          const on = n <= filled
          const segZone = n > max ? 'over' : zoneForSegment(muscle, n)
          return (
            <span
              key={n}
              className="h-5 flex-1 rounded-[3px]"
              style={{ backgroundColor: on ? ZONE_COLORS[segZone] : '#1A1A1A', opacity: on ? 1 : 0.9 }}
            />
          )
        })}
      </div>
      {caption && <p className="mt-1 text-[11px] text-text-muted">{caption}</p>}
    </div>
  )
}
