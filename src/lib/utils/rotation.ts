import type { WorkoutTemplate } from '../data/templates'
import { workoutTemplates } from '../data/templates'

// Cycle: Push A, rest, Pull A, rest, Push B, rest, Pull B, rest = 8 days
const CYCLE_LENGTH = 8
const WORKOUT_DAYS: (string | null)[] = [
  'push_a', null, 'pull_a', null, 'push_b', null, 'pull_b', null,
]

export interface TodayInfo {
  isRestDay: boolean
  templateId: string | null
  template: WorkoutTemplate | null
  cycleNumber: number
  dayInCycle: number
  nextWorkout: { template: WorkoutTemplate; date: Date } | null
}

export function getDateDiffDays(startDate: string, targetDate: string): number {
  const start = new Date(startDate + 'T00:00:00')
  const target = new Date(targetDate + 'T00:00:00')
  return Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function getTodayInfo(startDate: string, today?: string): TodayInfo {
  const todayStr = today || new Date().toISOString().split('T')[0]
  const daysDiff = getDateDiffDays(startDate, todayStr)

  if (daysDiff < 0) {
    return {
      isRestDay: true,
      templateId: null,
      template: null,
      cycleNumber: 0,
      dayInCycle: 0,
      nextWorkout: getNextWorkout(startDate, todayStr),
    }
  }

  const dayInCycle = daysDiff % CYCLE_LENGTH
  const cycleNumber = Math.floor(daysDiff / CYCLE_LENGTH) + 1
  const templateId = WORKOUT_DAYS[dayInCycle]

  if (!templateId) {
    return {
      isRestDay: true,
      templateId: null,
      template: null,
      cycleNumber,
      dayInCycle,
      nextWorkout: getNextWorkout(startDate, todayStr),
    }
  }

  const template = workoutTemplates.find((t) => t.id === templateId) || null

  return {
    isRestDay: false,
    templateId,
    template,
    cycleNumber,
    dayInCycle,
    nextWorkout: null,
  }
}

function getNextWorkout(
  startDate: string,
  fromDate: string
): { template: WorkoutTemplate; date: Date } | null {
  const from = new Date(fromDate + 'T00:00:00')

  for (let i = 1; i <= CYCLE_LENGTH; i++) {
    const checkDate = new Date(from)
    checkDate.setDate(checkDate.getDate() + i)
    const checkStr = checkDate.toISOString().split('T')[0]
    const daysDiff = getDateDiffDays(startDate, checkStr)

    if (daysDiff < 0) continue

    const dayInCycle = daysDiff % CYCLE_LENGTH
    const templateId = WORKOUT_DAYS[dayInCycle]

    if (templateId) {
      const template = workoutTemplates.find((t) => t.id === templateId)
      if (template) {
        return { template, date: checkDate }
      }
    }
  }

  return null
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
