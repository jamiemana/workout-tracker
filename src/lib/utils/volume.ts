import { db, type LoggedSet } from '../data/db'

/**
 * kg lifted across completed sets. Level sets count at their kg equivalent;
 * bodyweight sets carry no load and add nothing.
 */
export function totalVolumeKg(sets: LoggedSet[]): number {
  return sets.reduce(
    (t, s) => (s.completed && s.weightKg !== null ? t + s.weightKg * s.reps : t),
    0
  )
}

export async function getSessionStats(sessionId: number) {
  const session = await db.workoutSessions.get(sessionId)
  if (!session) return null

  const sets = await db.loggedSets.where('sessionId').equals(sessionId).toArray()
  const prs = await db.personalRecords.where('sessionId').equals(sessionId).toArray()

  const completedSets = sets.filter((s) => s.completed)
  const totalVolume = totalVolumeKg(completedSets)

  let durationMinutes = 0
  if (session.startedAt && session.completedAt) {
    durationMinutes = Math.round(
      (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
    )
  }

  return {
    totalVolume,
    completedSets: completedSets.length,
    totalSets: sets.length,
    prCount: prs.length,
    durationMinutes,
  }
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}
