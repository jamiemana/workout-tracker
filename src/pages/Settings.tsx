import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { exportAllData, downloadJSON, importData } from '@/lib/utils/backup'
import { db } from '@/lib/data/db'

export default function Settings() {
  const navigate = useNavigate()
  const {
    startDate,
    restTimerDefault,
    autoBackup,
    setStartDate,
    setRestTimerDefault,
    setAutoBackup,
    setOnboarded,
  } = useSettingsStore()

  const [resetStep, setResetStep] = useState(0)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    const data = await exportAllData()
    downloadJSON(data)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await importData(text, 'replace')
      setImportStatus('Data imported successfully')
    } catch (err) {
      setImportStatus('Import failed: invalid file')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleReset = async () => {
    if (resetStep === 0) {
      setResetStep(1)
      return
    }
    if (resetStep === 1) {
      setResetStep(2)
      return
    }
    // Final step: clear everything
    await db.workoutSessions.clear()
    await db.loggedSets.clear()
    await db.personalRecords.clear()
    await db.userSettings.clear()
    localStorage.clear()
    setOnboarded(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:text-text-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Start date */}
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Program start date
          </label>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-bg-input px-4 py-3 text-sm text-text-primary"
          />
        </div>

        {/* Rest timer */}
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Default rest timer (seconds)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={restTimerDefault}
            min={30}
            max={300}
            onChange={(e) => setRestTimerDefault(parseInt(e.target.value) || 120)}
            className="w-full rounded-lg border border-border-subtle bg-bg-input px-4 py-3 font-mono text-sm text-text-primary"
          />
        </div>

        {/* Auto-backup */}
        <div className="flex items-center justify-between rounded-xl border border-border-default bg-bg-secondary px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Auto-backup</p>
            <p className="text-xs text-text-tertiary">
              Download JSON after each workout
            </p>
          </div>
          <button
            onClick={() => setAutoBackup(!autoBackup)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              autoBackup ? 'bg-accent-lime' : 'bg-bg-input'
            }`}
          >
            <div
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                autoBackup ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="w-full rounded-lg border border-border-default bg-bg-secondary px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
        >
          Export data (JSON)
        </button>

        {/* Import */}
        <button
          onClick={handleImportClick}
          className="w-full rounded-lg border border-border-default bg-bg-secondary px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
        >
          Import data (JSON)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        {importStatus && (
          <p className="text-xs text-accent-lime">{importStatus}</p>
        )}

        {/* Reset */}
        <button
          onClick={handleReset}
          className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
            resetStep === 0
              ? 'border-border-default bg-bg-secondary text-accent-coral'
              : resetStep === 1
              ? 'border-accent-coral/30 bg-accent-coral/10 text-accent-coral'
              : 'border-accent-coral bg-accent-coral/20 text-accent-coral'
          }`}
        >
          {resetStep === 0
            ? 'Reset program'
            : resetStep === 1
            ? 'Are you sure?'
            : 'This cannot be undone. Tap to confirm.'}
        </button>
      </div>
    </div>
  )
}
