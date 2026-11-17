export type LoadUnit = 'kg' | 'bw' | 'lvl'

/** One machine level (a plate on the weight stack) weighs this many kg. */
export const KG_PER_LEVEL = 4.5

/**
 * A logged load in kg: levels convert at KG_PER_LEVEL, kg passes through,
 * bodyweight has no load.
 */
export function toKg(weight: number | null, unit: LoadUnit): number | null {
  if (weight === null || unit === 'bw') return null
  return unit === 'lvl' ? Math.round(weight * KG_PER_LEVEL * 100) / 100 : weight
}
