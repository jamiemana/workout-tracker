import type { Muscle } from '@/lib/data/templates'
import { ZONE_COLORS, ZONE_LABELS, type Zone } from '@/lib/data/volume-landmarks'

interface BodyMapProps {
  zones: Record<Muscle, Zone>
}

const BODY = '#161616'
const OUTLINE = '#242424'

/**
 * Stylised front and back figure. One shape per muscle region, filled with
 * that muscle's weekly zone colour. Block shapes on purpose: it needs to read
 * at 320 px wide, not look anatomical.
 */
export default function BodyMap({ zones }: BodyMapProps) {
  const c = (m: Muscle) => ZONE_COLORS[zones[m]]
  const region = { stroke: OUTLINE, strokeWidth: 1 }

  return (
    <div>
      <svg viewBox="0 0 400 300" className="w-full" role="img" aria-label="Weekly volume by muscle">
        {/* ---------- FRONT (left figure, x 20..180) ---------- */}
        <g>
          {/* head, neck, base silhouette */}
          <circle cx="100" cy="28" r="20" fill={BODY} />
          <rect x="90" y="46" width="20" height="14" fill={BODY} />
          <path d="M60 60 H140 L150 120 L142 200 H58 L50 120 Z" fill={BODY} />
          {/* forearms, hands */}
          <path d="M28 150 L18 215 H38 L48 150 Z" fill={BODY} />
          <path d="M152 150 L162 215 H182 L172 150 Z" fill={BODY} />
          {/* lower legs (front, tibialis stays dark) */}
          <path d="M62 250 L60 295 H86 L88 250 Z" fill={BODY} />
          <path d="M112 250 L114 295 H140 L138 250 Z" fill={BODY} />

          {/* front delts (inner caps) */}
          <path d="M60 60 Q75 56 92 62 L88 80 Q72 78 62 82 Z" fill={c('front_delt')} {...region} />
          <path d="M140 60 Q125 56 108 62 L112 80 Q128 78 138 82 Z" fill={c('front_delt')} {...region} />
          {/* side delts (outer caps) */}
          <path d="M60 60 L40 72 L44 96 L62 84 Z" fill={c('side_delt')} {...region} />
          <path d="M140 60 L160 72 L156 96 L138 84 Z" fill={c('side_delt')} {...region} />
          {/* chest */}
          <path d="M62 84 Q80 78 98 86 L98 118 Q78 124 64 112 Z" fill={c('chest')} {...region} />
          <path d="M138 84 Q120 78 102 86 L102 118 Q122 124 136 112 Z" fill={c('chest')} {...region} />
          {/* biceps */}
          <path d="M42 98 L36 148 H50 L58 100 Z" fill={c('biceps')} {...region} />
          <path d="M158 98 L164 148 H150 L142 100 Z" fill={c('biceps')} {...region} />
          {/* core */}
          <path d="M70 122 H130 L126 196 H74 Z" fill={c('core')} {...region} />
          {/* quads */}
          <path d="M58 202 L54 248 H90 L94 202 Z" fill={c('quads')} {...region} />
          <path d="M142 202 L146 248 H110 L106 202 Z" fill={c('quads')} {...region} />
        </g>

        {/* ---------- BACK (right figure, x 220..380) ---------- */}
        <g transform="translate(200 0)">
          <circle cx="100" cy="28" r="20" fill={BODY} />
          <rect x="90" y="46" width="20" height="14" fill={BODY} />
          <path d="M60 60 H140 L150 120 L142 200 H58 L50 120 Z" fill={BODY} />
          <path d="M28 150 L18 215 H38 L48 150 Z" fill={BODY} />
          <path d="M152 150 L162 215 H182 L172 150 Z" fill={BODY} />

          {/* rear delts */}
          <path d="M60 60 L40 72 L44 96 L64 86 Z" fill={c('rear_delt')} {...region} />
          <path d="M140 60 L160 72 L156 96 L136 86 Z" fill={c('rear_delt')} {...region} />
          {/* upper back / traps */}
          <path d="M64 60 H136 L124 112 H76 Z" fill={c('upper_back')} {...region} />
          {/* lats */}
          <path d="M52 112 L76 112 L98 130 L96 182 L60 160 Z" fill={c('lats')} {...region} />
          <path d="M148 112 L124 112 L102 130 L104 182 L140 160 Z" fill={c('lats')} {...region} />
          {/* triceps */}
          <path d="M42 98 L36 148 H50 L58 100 Z" fill={c('triceps')} {...region} />
          <path d="M158 98 L164 148 H150 L142 100 Z" fill={c('triceps')} {...region} />
          {/* glutes */}
          <path d="M60 186 Q80 178 98 190 L96 214 H62 Z" fill={c('glutes')} {...region} />
          <path d="M140 186 Q120 178 102 190 L104 214 H138 Z" fill={c('glutes')} {...region} />
          {/* hamstrings */}
          <path d="M62 218 L58 256 H90 L94 218 Z" fill={c('hamstrings')} {...region} />
          <path d="M138 218 L142 256 H110 L106 218 Z" fill={c('hamstrings')} {...region} />
          {/* calves */}
          <path d="M62 260 L62 295 H86 L88 260 Z" fill={c('calves')} {...region} />
          <path d="M112 260 L114 295 H138 L138 260 Z" fill={c('calves')} {...region} />
        </g>
      </svg>

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
    </div>
  )
}
