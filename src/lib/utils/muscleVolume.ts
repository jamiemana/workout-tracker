import { db } from '../data/db'
import {
  MUSCLES,
  getExerciseById,
  workoutTemplates,
  type ExerciseTemplate,
  type Muscle,
  type WorkoutTemplate,
} from '../data/templates'

export type MuscleSets = Record<Muscle, number>

const SECONDARY_WEIGHT = 0.5

function emptySets(): MuscleSets {
  return Object.fromEntries(MUSCLES.map((m) => [m, 0])) as MuscleSets
}

function addExercise(acc: MuscleSets, ex: ExerciseTemplate, sets: number) {
  acc[ex.muscle] += sets
  for (const m of ex.secondary ?? []) acc[m] += sets * SECONDARY_WEIGHT
}

function isoDaysAgo(days: number, from: Date): string {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

/**
 * Completed hard sets per muscle over the last 7 days, today inclusive, so
 * the session in progress counts as sets are ticked.
 */
export async function getWeeklySets(now: Date = new Date()): Promise<MuscleSets> {
  const since = isoDaysAgo(6, now)
  const sessions = await db.workoutSessions.where('date').aboveOrEqual(since).toArray()
  const acc = emptySets()
  if (sessions.length === 0) return acc

  const ids = sessions.map((s) => s.id!).filter((id) => id !== undefined)
  const sets = await db.loggedSets.where('sessionId').anyOf(ids).toArray()
  for (const s of sets) {
    if (!s.completed) continue
    const ex = getExerciseById(s.exerciseId)
    if (ex) addExercise(acc, ex, 1)
  }
  return acc
}

/** Planned sets per muscle for one workout. */
export function plannedSetsForTemplate(t: WorkoutTemplate): MuscleSets {
  const acc = emptySets()
  for (const ex of t.exercises) addExercise(acc, ex, ex.targetSets)
  return acc
}

/** Planned sets per muscle across one full pass of the four workouts. */
export function plannedSetsPerCycle(): MuscleSets {
  const acc = emptySets()
  for (const t of workoutTemplates) {
    for (const ex of t.exercises) addExercise(acc, ex, ex.targetSets)
  }
  return acc
}

export function addSets(a: MuscleSets, b: MuscleSets): MuscleSets {
  const out = emptySets()
  for (const m of MUSCLES) out[m] = a[m] + b[m]
  return out
}

export function roundSets(n: number): number {
  return Math.round(n * 2) / 2
}
