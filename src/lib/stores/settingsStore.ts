import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type WeightUnit = 'kg' | 'lvl'

interface SettingsState {
  startDate: string | null
  unit: 'kg'
  exerciseUnits: Record<string, WeightUnit>
  restTimerDefault: number
  autoBackup: boolean
  onboarded: boolean
  setStartDate: (date: string) => void
  setExerciseUnit: (exerciseId: string, unit: WeightUnit) => void
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
      restTimerDefault: 120,
      autoBackup: true,
      onboarded: false,
      setStartDate: (date) => set({ startDate: date }),
      setExerciseUnit: (exerciseId, unit) =>
        set((state) => ({
          exerciseUnits: { ...state.exerciseUnits, [exerciseId]: unit },
        })),
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
