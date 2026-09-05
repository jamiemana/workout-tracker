import type { Muscle } from './templates'

export type Zone = 'none' | 'maintaining' | 'growth' | 'focus' | 'over'

export interface Landmarks {
  /** First set count that leaves maintenance and starts driving growth. */
  growth: number
  /** First set count in the focus zone (high stimulus, watch recovery). */
  focus: number
  /** Weekly max; beyond this recovery usually suffers. */
  max: number
}

// Weekly hard-set landmarks per muscle, primary sets counted in full and
// secondary at half. Conventional hypertrophy ranges rounded for four
// sessions per cycle at 43. Tune here, nowhere else.
export const LANDMARKS: Record<Muscle, Landmarks> = {
  chest:      { growth: 6, focus: 12, max: 16 },
  front_delt: { growth: 4, focus: 8,  max: 12 },
  side_delt:  { growth: 8, focus: 14, max: 20 },
  rear_delt:  { growth: 6, focus: 12, max: 18 },
  triceps:    { growth: 6, focus: 10, max: 14 },
  biceps:     { growth: 6, focus: 10, max: 14 },
  lats:       { growth: 8, focus: 12, max: 18 },
  upper_back: { growth: 8, focus: 12, max: 18 },
  quads:      { growth: 8, focus: 12, max: 16 },
  hamstrings: { growth: 6, focus: 10, max: 14 },
  glutes:     { growth: 4, focus: 8,  max: 12 },
  calves:     { growth: 6, focus: 10, max: 16 },
  core:       { growth: 6, focus: 10, max: 16 },
}

export const ZONE_LABELS: Record<Zone, string> = {
  none: 'Untrained',
  maintaining: 'Maintaining',
  growth: 'Growth zone',
  focus: 'Focus zone',
  over: 'Over max',
}

export const ZONE_COLORS: Record<Zone, string> = {
  none: '#1E1E1E',
  maintaining: '#3B82F6',
  growth: '#ADFF02',
  focus: '#EAB308',
  over: '#FC7753',
}

export function zoneFor(muscle: Muscle, sets: number): Zone {
  const l = LANDMARKS[muscle]
  if (sets < 0.5) return 'none'
  if (sets > l.max) return 'over'
  if (sets >= l.focus) return 'focus'
  if (sets >= l.growth) return 'growth'
  return 'maintaining'
}

/** Zone of the nth segment (1-based) in a bar of `max` segments. */
export function zoneForSegment(muscle: Muscle, n: number): Zone {
  return zoneFor(muscle, n)
}
