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

export function downloadJSON(data: BackupData) {
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `workout-backup-${dateStr}.json`
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

export async function triggerAutoBackup() {
  const data = await exportAllData()
  downloadJSON(data)
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
