import type { ExerciseTemplate } from '../data/templates'
import type { WeightUnit } from '../stores/settingsStore'

export interface PrevSet {
  setNumber: number
  weight: number | null
  reps: number
}

export interface ProgressionTarget {
  /** increase = add load; hold = same load, chase reps; reps = bodyweight rep goal. */
  kind: 'increase' | 'hold' | 'reps'
  weight: number | null
  /** Rep goal for the hardest set. */
  reps: number
  unit: WeightUnit | 'bw'
  /** Load step used for 'increase' (0 otherwise). */
  increment: number
}

/** Load step per equipment type, in kg. Machine levels always step by 1. */
export const INCREMENTS: Record<ExerciseTemplate['equipmentType'], number> = {
  dumbbell: 2,
  barbell: 2.5,
  cable: 2.5,
  machine: 2.5,
  bodyweight: 2.5,
}

export function parseRepRange(target: string): { min: number; max: number } {
  const m = target.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!m) return { min: 1, max: 1 }
  const min = parseInt(m[1], 10)
  const max = m[2] ? parseInt(m[2], 10) : min
  return { min, max: Math.max(min, max) }
}

export function incrementFor(ex: ExerciseTemplate, unit: WeightUnit): number {
  return unit === 'lvl' ? 1 : INCREMENTS[ex.equipmentType]
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Double progression on the previous session's completed sets.
 * - Every set at the working weight reached the top of the rep range:
 *   add one increment, aim for the bottom of the range.
 * - Otherwise hold the weight and aim for one more rep than the weakest set.
 * - Bodyweight: chase reps only.
 * `declined` = the lifter turned off "added next time" after that session.
 */
export function computeTarget(
  ex: ExerciseTemplate,
  prev: PrevSet[],
  unit: WeightUnit,
  declined = false
): ProgressionTarget | null {
  if (prev.length === 0) return null
  const { min, max } = parseRepRange(ex.targetReps)

  const weighted = prev.filter((p) => p.weight !== null && p.weight > 0)

  if (weighted.length === 0) {
    const lowest = Math.min(...prev.map((p) => p.reps))
    const allHitMax = prev.every((p) => p.reps >= max)
    return {
      kind: 'reps',
      weight: null,
      reps: allHitMax ? max + 1 : Math.min(max, lowest + 1),
      unit: 'bw',
      increment: 0,
    }
  }

  // Working weight = the load used in the most sets; ties go to the heavier.
  const counts = new Map<number, number>()
  for (const p of weighted) counts.set(p.weight!, (counts.get(p.weight!) ?? 0) + 1)
  let w = 0
  let best = -1
  for (const [weight, n] of counts) {
    if (n > best || (n === best && weight > w)) {
      w = weight
      best = n
    }
  }

  const atW = weighted.filter((p) => p.weight === w)
  const lowest = Math.min(...atW.map((p) => p.reps))
  const allHitMax = atW.every((p) => p.reps >= max)
  const inc = incrementFor(ex, unit)

  if (allHitMax && !declined) {
    return { kind: 'increase', weight: round(w + inc), reps: min, unit, increment: inc }
  }
  return {
    kind: 'hold',
    weight: w,
    reps: allHitMax ? max : Math.min(max, lowest + 1),
    unit,
    increment: 0,
  }
}

export function formatLoad(weight: number, unit: WeightUnit): string {
  return unit === 'lvl' ? `L${weight}` : `${weight} kg`
}
