import {
  db,
  backfillKgEquivalents,
  relocalizeSessionDates,
  type LoggedSet,
  type PersonalRecord,
  type WorkoutSession,
} from '../data/db'
import { useSettingsStore, type WeightUnit } from '../stores/settingsStore'
import { localISODate } from './date'

/** The preferences worth carrying to another device. */
export interface BackupSettings {
  startDate: string | null
  exerciseUnits: Record<string, WeightUnit>
  declinedIncrease: Record<string, number>
  deloadStartedAt: string | null
  restTimerDefault: number
  autoBackup: boolean
}

export interface BackupData {
  /** 2 added `settings`; version 1 files import without them. */
  version: 1 | 2
  exportedAt: string
  workoutSessions: unknown[]
  loggedSets: unknown[]
  personalRecords?: unknown[]
  settings?: unknown
}

function currentSettings(): BackupSettings {
  const s = useSettingsStore.getState()
  return {
    startDate: s.startDate,
    exerciseUnits: s.exerciseUnits,
    declinedIncrease: s.declinedIncrease,
    deloadStartedAt: s.deloadStartedAt,
    restTimerDefault: s.restTimerDefault,
    autoBackup: s.autoBackup,
  }
}

function restoreSettings(raw: Record<string, unknown>) {
  const next: Partial<BackupSettings> = {}
  if (typeof raw.startDate === 'string' || raw.startDate === null) next.startDate = raw.startDate
  if (isRecord(raw.exerciseUnits)) {
    next.exerciseUnits = Object.fromEntries(
      Object.entries(raw.exerciseUnits).filter(([, u]) => u === 'kg' || u === 'lvl')
    ) as Record<string, WeightUnit>
  }
  if (isRecord(raw.declinedIncrease)) {
    next.declinedIncrease = Object.fromEntries(
      Object.entries(raw.declinedIncrease).filter(([, id]) => typeof id === 'number')
    ) as Record<string, number>
  }
  if (typeof raw.deloadStartedAt === 'string' || raw.deloadStartedAt === null) {
    next.deloadStartedAt = raw.deloadStartedAt
  }
  if (typeof raw.restTimerDefault === 'number' && raw.restTimerDefault > 0) {
    next.restTimerDefault = raw.restTimerDefault
  }
  if (typeof raw.autoBackup === 'boolean') next.autoBackup = raw.autoBackup
  useSettingsStore.setState(next)
}

export async function exportAllData(): Promise<BackupData> {
  const workoutSessions = await db.workoutSessions.toArray()
  const loggedSets = await db.loggedSets.toArray()
  const personalRecords = await db.personalRecords.toArray()

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    workoutSessions,
    loggedSets,
    personalRecords,
    settings: currentSettings(),
  }
}

function backupFilename(): string {
  const dateStr = localISODate()
  return `workout-backup-${dateStr}.json`
}

export function downloadJSON(data: BackupData) {
  const filename = backupFilename()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export type BackupOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * Offer the backup through the OS share sheet (on iOS that includes
 * "Save to Files", so it can go straight to iCloud Drive). Falls back to a
 * plain download where the Web Share API is missing or refuses the call.
 * Must be called from a user gesture for the share sheet to open.
 */
export async function shareOrDownloadJSON(data: BackupData): Promise<BackupOutcome> {
  const filename = backupFilename()
  const json = JSON.stringify(data, null, 2)
  const file = new File([json], filename, { type: 'application/json' })

  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean
    share?: (d: ShareData) => Promise<void>
  }
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // NotAllowedError (no user activation) or anything else: fall through.
    }
  }
  downloadJSON(data)
  return 'downloaded'
}

export async function triggerAutoBackup(): Promise<BackupOutcome> {
  const data = await exportAllData()
  return shareOrDownloadJSON(data)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Throws with a readable reason unless `data` is a usable backup. */
function validateBackup(data: unknown): asserts data is BackupData {
  if (!isRecord(data)) throw new Error('not a workout backup')
  const { workoutSessions, loggedSets, personalRecords } = data
  if (!Array.isArray(workoutSessions) || !Array.isArray(loggedSets)) {
    throw new Error('not a workout backup')
  }
  if (personalRecords !== undefined && !Array.isArray(personalRecords)) {
    throw new Error('personal records are malformed')
  }
  if (workoutSessions.length === 0) throw new Error('the backup has no workouts')

  const sessionIds = new Set<number>()
  for (const s of workoutSessions) {
    if (
      !isRecord(s) ||
      typeof s.id !== 'number' ||
      typeof s.templateId !== 'string' ||
      typeof s.date !== 'string' ||
      typeof s.startedAt !== 'string'
    ) {
      throw new Error('a workout in the backup is malformed')
    }
    sessionIds.add(s.id)
  }
  for (const s of loggedSets) {
    if (
      !isRecord(s) ||
      typeof s.sessionId !== 'number' ||
      typeof s.exerciseId !== 'string' ||
      typeof s.reps !== 'number' ||
      (s.weight !== null && typeof s.weight !== 'number') ||
      !['kg', 'bw', 'lvl'].includes(s.unit as string)
    ) {
      throw new Error('a set in the backup is malformed')
    }
    if (!sessionIds.has(s.sessionId)) {
      throw new Error('a set in the backup belongs to no workout')
    }
  }
  for (const p of personalRecords ?? []) {
    if (!isRecord(p) || typeof p.sessionId !== 'number' || typeof p.exerciseId !== 'string') {
      throw new Error('a personal record in the backup is malformed')
    }
  }
}

/**
 * Replace everything with the contents of a backup. The file is checked in
 * full first, and the swap runs in one transaction, so a bad file or a
 * failed write leaves the existing data as it was. Rows keep their ids so
 * sets and PRs stay attached to their sessions.
 */
export async function importData(jsonString: string): Promise<void> {
  let data: unknown
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('the file is not valid JSON')
  }
  validateBackup(data)
  const backup = data

  await db.transaction(
    'rw',
    db.workoutSessions,
    db.loggedSets,
    db.personalRecords,
    async () => {
      await db.workoutSessions.clear()
      await db.loggedSets.clear()
      await db.personalRecords.clear()
      await db.workoutSessions.bulkAdd(backup.workoutSessions as WorkoutSession[])
      await db.loggedSets.bulkAdd(backup.loggedSets as LoggedSet[])
      await db.personalRecords.bulkAdd((backup.personalRecords ?? []) as PersonalRecord[])
      // Older backups predate the kg equivalent and used UTC dates.
      await backfillKgEquivalents(db.loggedSets, db.personalRecords)
      await relocalizeSessionDates(db.workoutSessions, db.personalRecords)
    }
  )

  // Backups from before settings were included carry none; keep what's here.
  if (isRecord(backup.settings)) restoreSettings(backup.settings)
}
