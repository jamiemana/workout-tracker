import Dexie, { type EntityTable } from 'dexie'

export interface WorkoutSession {
  id?: number
  templateId: string
  date: string
  cycleNumber: number
  startedAt: string
  completedAt: string | null
  notes: string | null
}

export interface LoggedSet {
  id?: number
  sessionId: number
  exerciseId: string
  setNumber: number
  weight: number | null
  unit: 'kg' | 'bw'
  reps: number
  completed: boolean
  timestamp: string
}

export interface PersonalRecord {
  id?: number
  exerciseId: string
  prType: 'weight' | 'rep' | 'volume'
  weight: number | null
  reps: number
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

export { db }
