import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { localISODate } from '../utils/date'

export type WeightUnit = 'kg' | 'lvl'

export const DELOAD_DAYS = 7

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return localISODate(d)
}

/** First day after the deload week, as an ISO date. */
export function deloadEndsOn(startedAt: string): string {
  return addDays(startedAt, DELOAD_DAYS)
}

export function isDeloadActive(
  startedAt: string | null,
  today: string = localISODate()
): boolean {
  if (!startedAt) return false
  return today >= startedAt && today < deloadEndsOn(startedAt)
}

interface SettingsState {
  startDate: string | null
  unit: 'kg'
  exerciseUnits: Record<string, WeightUnit>
  /** exerciseId -> id of the session in which "added next time" was switched off. */
  declinedIncrease: Record<string, number>
  /** ISO date the current deload week began, or null. */
  deloadStartedAt: string | null
  restTimerDefault: number
  autoBackup: boolean
  onboarded: boolean
  setStartDate: (date: string) => void
  setExerciseUnit: (exerciseId: string, unit: WeightUnit) => void
  setDeclinedIncrease: (exerciseId: string, sessionId: number | null) => void
  startDeload: () => void
  endDeload: () => void
  setRestTimerDefault: (seconds: number) => void
  setAutoBackup: (enabled: boolean) => void
  setOnboarded: (val: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      startDate: null,
      unit: 'kg',
      exerciseUnits: {},
      declinedIncrease: {},
      deloadStartedAt: null,
      restTimerDefault: 90,
      autoBackup: true,
      onboarded: false,
      setStartDate: (date) => set({ startDate: date }),
      setExerciseUnit: (exerciseId, unit) =>
        set((state) => ({
          exerciseUnits: { ...state.exerciseUnits, [exerciseId]: unit },
        })),
      setDeclinedIncrease: (exerciseId, sessionId) =>
        set((state) => {
          const next = { ...state.declinedIncrease }
          if (sessionId === null) delete next[exerciseId]
          else next[exerciseId] = sessionId
          return { declinedIncrease: next }
        }),
      startDeload: () =>
        set({ deloadStartedAt: localISODate() }),
      endDeload: () => set({ deloadStartedAt: null }),
      setRestTimerDefault: (seconds) => set({ restTimerDefault: seconds }),
      setAutoBackup: (enabled) => set({ autoBackup: enabled }),
      setOnboarded: (val) => set({ onboarded: val }),
    }),
    {
      name: 'workout-settings',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsState>
        // v2: the default rest dropped from 120 s to 90 s for the five-day
        // split. Only the old default moves; a hand-set value is kept.
        if (version < 2 && state.restTimerDefault === 120) {
          return { ...state, restTimerDefault: 90 }
        }
        return state
      },
    }
  )
)
