import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type WeightUnit = 'kg' | 'lvl'

interface SettingsState {
  startDate: string | null
  unit: 'kg'
  exerciseUnits: Record<string, WeightUnit>
  /** exerciseId -> session date on which "added next time" was switched off. */
  declinedIncrease: Record<string, string>
  restTimerDefault: number
  autoBackup: boolean
  onboarded: boolean
  setStartDate: (date: string) => void
  setExerciseUnit: (exerciseId: string, unit: WeightUnit) => void
  setDeclinedIncrease: (exerciseId: string, date: string | null) => void
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
      restTimerDefault: 120,
      autoBackup: true,
      onboarded: false,
      setStartDate: (date) => set({ startDate: date }),
      setExerciseUnit: (exerciseId, unit) =>
        set((state) => ({
          exerciseUnits: { ...state.exerciseUnits, [exerciseId]: unit },
        })),
      setDeclinedIncrease: (exerciseId, date) =>
        set((state) => {
          const next = { ...state.declinedIncrease }
          if (date === null) delete next[exerciseId]
          else next[exerciseId] = date
          return { declinedIncrease: next }
        }),
      setRestTimerDefault: (seconds) => set({ restTimerDefault: seconds }),
      setAutoBackup: (enabled) => set({ autoBackup: enabled }),
      setOnboarded: (val) => set({ onboarded: val }),
    }),
    {
      name: 'workout-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
