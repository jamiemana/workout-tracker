import { db, type PersonalRecord } from '../data/db'

export interface PRCheckResult {
  isPR: boolean
  prType: 'weight' | 'rep' | 'volume' | null
}

export async function checkAndRecordPR(
  exerciseId: string,
  weight: number | null,
  reps: number,
  sessionId: number,
  date: string,
  loggedSetId: number
): Promise<PRCheckResult> {
  if (weight === null || reps <= 0) {
    return { isPR: false, prType: null }
  }

  const allSets = await db.loggedSets
    .where('exerciseId')
    .equals(exerciseId)
    .toArray()

  const priorSets = allSets.filter(
    (s) => s.id !== loggedSetId && s.completed && s.weight !== null
  )

  // Pareto rule: a set is a PR unless some prior set matches or beats it on
  // both axes (heavier-or-equal weight AND same-or-more reps). This makes
  // heavier weight at fewer reps count as a PR, and more reps at the same
  // weight count as a PR.
  const dominated = priorSets.some(
    (s) => (s.weight ?? 0) >= weight && s.reps >= reps
  )
  if (dominated) return { isPR: false, prType: null }

  const maxPriorWeight = priorSets.reduce(
    (m, s) => Math.max(m, s.weight ?? 0),
    0
  )

  let prType: 'weight' | 'rep' | 'volume'
  if (weight > maxPriorWeight) {
    prType = 'weight'
  } else {
    const maxRepsAtOrAboveWeight = priorSets
      .filter((s) => (s.weight ?? 0) >= weight)
      .reduce((m, s) => Math.max(m, s.reps), 0)
    prType = reps > maxRepsAtOrAboveWeight ? 'rep' : 'volume'
  }

  const record: PersonalRecord = {
    exerciseId,
    prType,
    weight,
    reps,
    volume: weight * reps,
    date,
    sessionId,
  }
  await db.personalRecords.add(record)
  return { isPR: true, prType }
}

export async function getExercisePRs(exerciseId: string): Promise<PersonalRecord[]> {
  return db.personalRecords.where('exerciseId').equals(exerciseId).toArray()
}
