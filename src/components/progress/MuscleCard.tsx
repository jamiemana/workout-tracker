import { MUSCLE_LABELS, type Muscle } from '@/lib/data/templates'
import { LANDMARKS, ZONE_COLORS, hintFor, zoneFor } from '@/lib/data/volume-landmarks'
import BodyMap, { MUSCLE_VIEW } from './BodyMap'

interface MuscleCardProps {
  muscle: Muscle
  sets: number
  /** Small caption under the bar, e.g. "Also front delts, triceps (half)". */
  note?: string
  className?: string
}

function fmt(n: number): string {
  const r = Math.round(n * 2) / 2
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/** One muscle's weekly volume: label, count, zone hint, thumbnail and zone bar. */
export default function MuscleCard({ muscle, sets, note, className = '' }: MuscleCardProps) {
  const { max } = LANDMARKS[muscle]
  const zone = zoneFor(muscle, sets)
  const hint = hintFor(muscle, sets)
  const filled = Math.round(sets * 2) / 2
  const count = Math.max(max, Math.ceil(filled))
  const segments = Array.from({ length: count }, (_, i) => {
    const n = i + 1
    const z = n > max ? 'over' : zoneFor(muscle, n)
    return { color: ZONE_COLORS[z], on: n <= filled }
  })
  const thumbZones = { [muscle]: zone === 'none' ? 'maintaining' : zone } as const

  return (
    <div className={`rounded-2xl border border-border-default bg-bg-tertiary p-4 ${className}`}>
      <p className="text-[17px] font-semibold text-text-primary">{MUSCLE_LABELS[muscle]}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="text-[15px] text-text-secondary">
          <span className="text-[17px] font-semibold text-text-primary">{fmt(sets)}</span> of{' '}
          {max} weekly sets
        </p>
        <p className="text-[15px] font-medium" style={{ color: hint.color }}>
          {hint.text}
        </p>
      </div>
      <div className="mt-2.5 flex items-center gap-3.5">
        <BodyMap view={MUSCLE_VIEW[muscle]} zones={thumbZones} className="w-16 shrink-0" />
        <div className="flex h-9 flex-1 gap-1" aria-hidden>
          {segments.map((s, i) => (
            <span
              key={i}
              className="flex-1 rounded-md"
              style={{ backgroundColor: s.color, opacity: s.on ? 1 : 0.22 }}
            />
          ))}
        </div>
      </div>
      {note && (
        <p className="mt-2 text-[11px] uppercase tracking-widest text-text-muted">{note}</p>
      )}
    </div>
  )
}
