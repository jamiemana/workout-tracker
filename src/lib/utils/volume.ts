import { db } from '../data/db'

export function calculateSetVolume(weight: number | null, reps: number): number {
  if (weight === null || weight <= 0) return 0
  return weight * reps
}

export async function getSessionVolume(sessionId: number): Promise<number> {
  const sets = await db.loggedSets.where('sessionId').equals(sessionId).toArray()
  return sets.reduce((total, s) => {
    if (s.completed && s.weight !== null) {
      return total + s.weight * s.reps
    }
    return total
  }, 0)
}

export async function getSessionStats(sessionId: number) {
  const session = await db.workoutSessions.get(sessionId)
  if (!session) return null

  const sets = await db.loggedSets.where('sessionId').equals(sessionId).toArray()
  const prs = await db.personalRecords.where('sessionId').equals(sessionId).toArray()

  const completedSets = sets.filter((s) => s.completed)
  const totalVolume = completedSets.reduce((t, s) => {
    return t + (s.weight ?? 0) * s.reps
  }, 0)

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
