import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  startDate: string | null
  unit: 'kg'
  restTimerDefault: number
  autoBackup: boolean
  onboarded: boolean
  setStartDate: (date: string) => void
  setRestTimerDefault: (seconds: number) => void
  setAutoBackup: (enabled: boolean) => void
  setOnboarded: (val: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      startDate: null,
      unit: 'kg',
      restTimerDefault: 120,
      autoBackup: true,
      onboarded: false,
      setStartDate: (date) => set({ startDate: date }),
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
