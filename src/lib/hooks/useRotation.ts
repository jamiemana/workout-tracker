import { useMemo } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { getTodayInfo, type TodayInfo } from '../utils/rotation'

export function useRotation(date?: string): TodayInfo | null {
  const startDate = useSettingsStore((s) => s.startDate)

  return useMemo(() => {
    if (!startDate) return null
    return getTodayInfo(startDate, date)
  }, [startDate, date])
}
