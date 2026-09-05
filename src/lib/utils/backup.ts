import { db } from '../data/db'

export interface BackupData {
  version: 1
  exportedAt: string
  workoutSessions: unknown[]
  loggedSets: unknown[]
  personalRecords: unknown[]
  settings: unknown
}

export async function exportAllData(): Promise<BackupData> {
  const workoutSessions = await db.workoutSessions.toArray()
  const loggedSets = await db.loggedSets.toArray()
  const personalRecords = await db.personalRecords.toArray()
  const settings = await db.userSettings.toArray()

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workoutSessions,
    loggedSets,
    personalRecords,
    settings: settings[0] || null,
  }
}

function backupFilename(): string {
  const dateStr = new Date().toISOString().split('T')[0]
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

export async function importData(
  jsonString: string,
  mode: 'replace' | 'merge' = 'replace'
) {
  const data = JSON.parse(jsonString) as BackupData

  if (mode === 'replace') {
    await db.workoutSessions.clear()
    await db.loggedSets.clear()
    await db.personalRecords.clear()
  }

  if (data.workoutSessions?.length) {
    await db.workoutSessions.bulkAdd(
      data.workoutSessions.map((s: any) => {
        const { id, ...rest } = s
        return rest
      })
    )
  }

  if (data.loggedSets?.length) {
    await db.loggedSets.bulkAdd(
      data.loggedSets.map((s: any) => {
        const { id, ...rest } = s
        return rest
      })
    )
  }

  if (data.personalRecords?.length) {
    await db.personalRecords.bulkAdd(
      data.personalRecords.map((s: any) => {
        const { id, ...rest } = s
        return rest
      })
    )
  }
}
