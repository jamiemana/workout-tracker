import { useId } from 'react'
import type { Muscle } from '@/lib/data/templates'
import { ZONE_COLORS, ZONE_LABELS, type Zone } from '@/lib/data/volume-landmarks'
import { BODY_GEOM } from './bodyPaths'

export type BodyView =
  | 'both'
  | 'front'
  | 'back'
  | 'front-torso'
  | 'back-torso'
  | 'front-legs'
  | 'back-legs'

/** The crop that shows a given muscle best on a card thumbnail. */
export const MUSCLE_VIEW: Record<Muscle, BodyView> = {
  chest: 'front-torso',
  front_delt: 'front-torso',
  side_delt: 'front-torso',
  biceps: 'front-torso',
  core: 'front-torso',
  rear_delt: 'back-torso',
  triceps: 'back-torso',
  lats: 'back-torso',
  upper_back: 'back-torso',
  quads: 'front-legs',
  hamstrings: 'back-legs',
  glutes: 'back-legs',
  calves: 'back-legs',
}

// Body (the gaps and untouched areas) is lighter than the muscles, as in the
// reference illustration; trained muscles take their zone colour.
const BODY = '#3a3a3a'
const NONE = '#232323'
const SELECT = '#adff02'

interface BodyMapProps {
  zones: Partial<Record<Muscle, Zone>>
  view?: BodyView
  selected?: Muscle | null
  onSelect?: (muscle: Muscle) => void
  /** When set and non-empty, every other muscle is dimmed. */
  dim?: Muscle[] | null
  legend?: boolean
  className?: string
}

type Side = 'front' | 'back'

function Figure({
  side,
  cx,
  zones,
  selected,
  onSelect,
  dim,
  uid,
}: {
  side: Side
  cx: number
  zones: Partial<Record<Muscle, Zone>>
  selected?: Muscle | null
  onSelect?: (m: Muscle) => void
  dim?: Muscle[] | null
  uid: string
}) {
  const g = BODY_GEOM[side]
  const regions = g.regions as Record<string, readonly string[]>
  const dimming = !!dim && dim.length > 0
  const gap = BODY_GEOM.gap

  const muscleProps = (muscle: Muscle) => ({
    'data-muscle': muscle,
    stroke: selected === muscle ? SELECT : BODY,
    strokeWidth: gap,
    strokeLinejoin: 'round' as const,
    style: {
      opacity: dimming && !dim!.includes(muscle) ? 0.25 : 1,
      transition: 'opacity 160ms ease',
      cursor: onSelect ? 'pointer' : undefined,
    },
    onClick: onSelect ? () => onSelect(muscle) : undefined,
  })
  const fillFor = (muscle: Muscle) => {
    const zone = zones[muscle]
    return zone && zone !== 'none' ? ZONE_COLORS[zone] : NONE
  }

  return (
    <g transform={`translate(${cx},0)`}>
      {g.silhouette.map((d, i) => (
        <path key={`s${i}`} d={d} fill={BODY} />
      ))}
      {g.detail.map((d, i) => (
        <path key={`d${i}`} d={d} fill={NONE} stroke={BODY} strokeWidth={gap} strokeLinejoin="round" />
      ))}
      {BODY_GEOM.order.map((m) => {
        const paths = regions[m]
        if (!paths) return null
        const muscle = m as Muscle
        return paths.map((d, i) => (
          <path key={`${m}${i}`} d={d} fill={fillFor(muscle)} {...muscleProps(muscle)} />
        ))
      })}
      {g.sideDelt.map((sd, i) => {
        const id = `sd-${uid}-${side}-${i}`
        const [x, y, w, h] = sd.rect
        return (
          <g key={id}>
            <clipPath id={id}>
              <rect x={x} y={y} width={w} height={h} />
            </clipPath>
            <path d={sd.d} clipPath={`url(#${id})`} fill={fillFor('side_delt')} {...muscleProps('side_delt')} />
          </g>
        )
      })}
    </g>
  )
}

/**
 * Front/back figure with each muscle painted by its zone. Geometry comes from
 * the reference illustration via design/muscle-map/trace_import.py.
 */
export default function BodyMap({
  zones,
  view = 'both',
  selected,
  onSelect,
  dim,
  legend = false,
  className,
}: BodyMapProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const common = { zones, selected, onSelect, dim, uid }
  return (
    <div className={className}>
      <svg
        viewBox={BODY_GEOM.viewbox[view]}
        className="block h-auto w-full"
        role="img"
        aria-label="Muscle map"
      >
        {view === 'both' ? (
          <>
            <Figure side="front" cx={120} {...common} />
            <Figure side="back" cx={360} {...common} />
          </>
        ) : (
          <Figure side={view.startsWith('front') ? 'front' : 'back'} cx={120} {...common} />
        )}
      </svg>
      {legend && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {(['maintaining', 'growth', 'focus'] as Zone[]).map((z) => (
            <span
              key={z}
              className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-secondary px-2.5 py-1 text-[11px] text-text-secondary"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[z] }} />
              {ZONE_LABELS[z]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
