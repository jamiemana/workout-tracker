import Dexie, { type EntityTable, type Table } from 'dexie'
import { toKg, type LoadUnit } from './units'

export interface WorkoutSession {
  id?: number
  templateId: string
  date: string
  cycleNumber: number
  startedAt: string
  completedAt: string | null
  notes: string | null
  // templateExerciseId -> currentExerciseId. Missing or equal = no swap.
  exerciseSwaps?: Record<string, string>
  /** exerciseId -> set count chosen with the − / + buttons, this session only. */
  setCounts?: Record<string, number>
  /** Started during a deload week: lighter targets, excluded from progression. */
  deload?: boolean
}

export interface LoggedSet {
  id?: number
  sessionId: number
  exerciseId: string
  setNumber: number
  /** Load as entered, in `unit`. */
  weight: number | null
  unit: LoadUnit
  /** Load in kg (levels converted at KG_PER_LEVEL); null for bodyweight. */
  weightKg: number | null
  reps: number
  completed: boolean
  timestamp: string
}

export interface PersonalRecord {
  id?: number
  exerciseId: string
  prType: 'weight' | 'rep' | 'volume'
  /** Load as entered on the set that earned it. */
  weight: number | null
  reps: number
  /** kg × reps, with levels converted to kg. */
  volume: number
  date: string
  sessionId: number
}

export interface UserSettings {
  id?: number
  startDate: string
  unit: 'kg'
  restTimerDefault: number
  autoBackup: boolean
}

const db = new Dexie('WorkoutTrackerDB') as Dexie & {
  workoutSessions: EntityTable<WorkoutSession, 'id'>
  loggedSets: EntityTable<LoggedSet, 'id'>
  personalRecords: EntityTable<PersonalRecord, 'id'>
  userSettings: EntityTable<UserSettings, 'id'>
}

db.version(1).stores({
  workoutSessions: '++id, templateId, date, cycleNumber, startedAt, completedAt',
  loggedSets: '++id, sessionId, exerciseId, setNumber, weight, unit, reps, completed, timestamp',
  personalRecords: '++id, exerciseId, prType, weight, reps, volume, date, sessionId',
  userSettings: '++id',
})

/**
 * Fill `weightKg` on every logged set and restate PR volume in kg. PRs carry
 * no unit, so a level PR is found through the set that earned it. Safe to
 * re-run; also used on imported backups that predate `weightKg`.
 */
export async function backfillKgEquivalents(
  loggedSets: Table<LoggedSet>,
  personalRecords: Table<PersonalRecord>
): Promise<void> {
  await loggedSets.toCollection().modify((s) => {
    s.weightKg = toKg(s.weight, s.unit)
  })

  const levelSets = await loggedSets.where('unit').equals('lvl').toArray()
  if (levelSets.length === 0) return
  const key = (x: { sessionId: number; exerciseId: string; weight: number | null; reps: number }) =>
    `${x.sessionId}|${x.exerciseId}|${x.weight}|${x.reps}`
  const kgBySet = new Map(levelSets.map((s) => [key(s), s.weightKg]))
  await personalRecords.toCollection().modify((p) => {
    const kg = kgBySet.get(key(p))
    if (kg != null) p.volume = kg * p.reps
  })
}

// v2: logged sets store their kg equivalent, so level-pinned machines count
// toward volume, PRs and 1RM estimates. No index changes.
db.version(2).upgrade((tx) =>
  backfillKgEquivalents(tx.table('loggedSets'), tx.table('personalRecords'))
)

export { db }
