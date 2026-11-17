import { db, type LoggedSet, type PersonalRecord } from '../data/db'

export interface PRCheckResult {
  isPR: boolean
  prType: 'weight' | 'rep' | 'volume' | null
}

/**
 * Loads are compared in kg, so a set logged in levels ranks against sets
 * logged in kg for the same exercise.
 */
export async function checkAndRecordPR(set: LoggedSet, date: string): Promise<PRCheckResult> {
  const kg = set.weightKg
  const reps = set.reps
  if (kg === null || reps <= 0) {
    return { isPR: false, prType: null }
  }

  const allSets = await db.loggedSets
    .where('exerciseId')
    .equals(set.exerciseId)
    .toArray()

  const prior = allSets
    .filter((s) => s.id !== set.id && s.completed && s.weightKg !== null)
    .map((s) => ({ kg: s.weightKg as number, reps: s.reps }))

  // Pareto rule: a set is a PR unless some prior set matches or beats it on
  // both axes (heavier-or-equal weight AND same-or-more reps). This makes
  // heavier weight at fewer reps count as a PR, and more reps at the same
  // weight count as a PR.
  const dominated = prior.some((s) => s.kg >= kg && s.reps >= reps)
  if (dominated) return { isPR: false, prType: null }

  const maxPriorKg = prior.reduce((m, s) => Math.max(m, s.kg), 0)

  let prType: 'weight' | 'rep' | 'volume'
  if (kg > maxPriorKg) {
    prType = 'weight'
  } else {
    const maxRepsAtOrAboveWeight = prior
      .filter((s) => s.kg >= kg)
      .reduce((m, s) => Math.max(m, s.reps), 0)
    prType = reps > maxRepsAtOrAboveWeight ? 'rep' : 'volume'
  }

  const record: PersonalRecord = {
    exerciseId: set.exerciseId,
    prType,
    weight: set.weight,
    reps,
    volume: kg * reps,
    date,
    sessionId: set.sessionId,
  }
  await db.personalRecords.add(record)
  return { isPR: true, prType }
}

export async function getExercisePRs(exerciseId: string): Promise<PersonalRecord[]> {
  return db.personalRecords.where('exerciseId').equals(exerciseId).toArray()
}
