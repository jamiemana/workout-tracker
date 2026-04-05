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
  date: string
): Promise<PRCheckResult> {
  if (weight === null || reps <= 0) {
    return { isPR: false, prType: null }
  }

  const volume = weight * reps
  const existingPRs = await db.personalRecords
    .where('exerciseId')
    .equals(exerciseId)
    .toArray()

  let isWeightPR = false
  let isRepPR = false
  let isVolumePR = false

  // Weight PR: higher weight at same or greater rep count
  const weightPRs = existingPRs.filter((p) => p.prType === 'weight')
  if (weightPRs.length === 0) {
    isWeightPR = true
  } else {
    const bestWeight = Math.max(...weightPRs.map((p) => p.weight || 0))
    if (weight > bestWeight) {
      isWeightPR = true
    }
  }

  // Rep PR: more reps at same or higher weight
  const repPRs = existingPRs.filter((p) => p.prType === 'rep')
  if (repPRs.length === 0) {
    isRepPR = true
  } else {
    const bestReps = Math.max(...repPRs.map((p) => p.reps))
    const bestRepsWeight = repPRs.find((p) => p.reps === bestReps)?.weight || 0
    if (reps > bestReps && weight >= bestRepsWeight) {
      isRepPR = true
    }
  }

  // Volume PR: higher single-set volume
  const volumePRs = existingPRs.filter((p) => p.prType === 'volume')
  if (volumePRs.length === 0) {
    isVolumePR = true
  } else {
    const bestVolume = Math.max(...volumePRs.map((p) => p.volume))
    if (volume > bestVolume) {
      isVolumePR = true
    }
  }

  // Weight PR takes priority
  let prType: 'weight' | 'rep' | 'volume' | null = null
  if (isWeightPR) prType = 'weight'
  else if (isVolumePR) prType = 'volume'
  else if (isRepPR) prType = 'rep'

  if (prType) {
    const record: PersonalRecord = {
      exerciseId,
      prType,
      weight,
      reps,
      volume,
      date,
      sessionId,
    }
    await db.personalRecords.add(record)
    return { isPR: true, prType }
  }

  return { isPR: false, prType: null }
}

export async function getExercisePRs(exerciseId: string): Promise<PersonalRecord[]> {
  return db.personalRecords.where('exerciseId').equals(exerciseId).toArray()
}
