import { useState } from 'react'
import { useSettingsStore } from '@/lib/stores/settingsStore'

export default function Onboarding() {
  const setStartDate = useSettingsStore((s) => s.setStartDate)
  const setOnboarded = useSettingsStore((s) => s.setOnboarded)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  const handleStart = () => {
    setStartDate(date)
    setOnboarded(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg-primary">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-lime/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-lime">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Workout</h1>
          <p className="mt-2 text-sm text-text-tertiary">
            Push/Pull 4-day rotation tracker
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-text-muted">
              Program start date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-input px-4 py-3 text-sm text-text-primary"
            />
            <p className="mt-2 text-xs text-text-tertiary">
              When did (or will) you start the program? Today&apos;s workout is calculated from this date.
            </p>
          </div>

          <button
            onClick={handleStart}
            className="w-full rounded-lg bg-accent-lime py-3.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-lime/90"
          >
            Start Tracking
          </button>
        </div>
      </div>
    </div>
  )
}
