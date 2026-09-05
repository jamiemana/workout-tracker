import type { Muscle } from '@/lib/data/templates'
import { ZONE_COLORS, ZONE_LABELS, type Zone } from '@/lib/data/volume-landmarks'
import { BODY_PATHS } from './bodyPaths'

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

const VIEWBOX: Record<BodyView, string> = {
  both: '0 0 400 520',
  front: '0 0 200 520',
  back: '0 0 200 520',
  'front-torso': '20 70 160 200',
  'back-torso': '20 70 160 200',
  'front-legs': '20 250 160 270',
  'back-legs': '20 250 160 270',
}

// The full figure sits on the page background; crops sit on a card, so they
// get a lighter body to stay legible.
const TONES = {
  full: { body: '#161616', none: '#1e1e1e', line: '#2a2a2a' },
  crop: { body: '#262626', none: '#333333', line: '#404040' },
}
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

function Figure({
  side,
  cx,
  zones,
  selected,
  onSelect,
  dim,
  tone,
}: {
  side: 'front' | 'back'
  cx: number
  zones: Partial<Record<Muscle, Zone>>
  selected?: Muscle | null
  onSelect?: (m: Muscle) => void
  dim?: Muscle[] | null
  tone: (typeof TONES)['full']
}) {
  const regions = BODY_PATHS[side] as Record<string, readonly string[]>
  const dimming = !!dim && dim.length > 0
  return (
    <g transform={`translate(${cx},0)`}>
      <path d={BODY_PATHS.head} fill={tone.body} />
      <path d={BODY_PATHS.neck} fill={tone.body} />
      {BODY_PATHS.silhouette.map((d, i) => (
        <path key={`s${i}`} d={d} fill={tone.body} />
      ))}
      {side === 'back' &&
        BODY_PATHS.erectors.map((d, i) => <path key={`e${i}`} d={d} fill={tone.none} />)}
      {BODY_PATHS.detail[side].map((d, i) => (
        <path key={`d${i}`} d={d} fill="none" stroke={tone.line} strokeWidth={1} />
      ))}
      {Object.entries(regions).map(([m, paths]) => {
        const muscle = m as Muscle
        const zone = zones[muscle]
        const fill = zone && zone !== 'none' ? ZONE_COLORS[zone] : tone.none
        const isSelected = selected === muscle
        const dimmed = dimming && !dim!.includes(muscle)
        return paths.map((d, i) => (
          <path
            key={`${m}${i}`}
            d={d}
            data-muscle={m}
            fill={fill}
            stroke={isSelected ? SELECT : tone.line}
            strokeWidth={isSelected ? 2 : 1}
            strokeLinejoin="round"
            style={{
              opacity: dimmed ? 0.25 : 1,
              transition: 'opacity 160ms ease',
              cursor: onSelect ? 'pointer' : undefined,
            }}
            onClick={onSelect ? () => onSelect(muscle) : undefined}
          />
        ))
      })}
    </g>
  )
}

/**
 * Stylised front/back figure with each muscle painted by its zone. Geometry
 * comes from design/muscle-map/build.py via bodyPaths.ts.
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
  const tone = view.includes('-') ? TONES.crop : TONES.full
  const common = { zones, selected, onSelect, dim, tone }
  return (
    <div className={className}>
      <svg
        viewBox={VIEWBOX[view]}
        className="block h-auto w-full"
        role="img"
        aria-label="Muscle map"
      >
        {view === 'both' && (
          <>
            <Figure side="front" cx={100} {...common} />
            <Figure side="back" cx={300} {...common} />
          </>
        )}
        {view !== 'both' && (
          <Figure side={view.startsWith('front') ? 'front' : 'back'} cx={100} {...common} />
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
