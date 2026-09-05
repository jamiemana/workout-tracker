import type { WorkoutTemplate } from '../data/templates'
import { workoutTemplates } from '../data/templates'
import { db } from '../data/db'

// The next workout is whichever follows the most recently completed session.
// No calendar, no rest days: Push A -> Pull A -> Push B -> Pull B -> Push A ...
export const ROTATION: WorkoutTemplate['id'][] = ['push_a', 'pull_a', 'push_b', 'pull_b']

export interface RotationInfo {
  /** The workout to do next. */
  template: WorkoutTemplate
  cycleNumber: number
  /** A session was already finished today. */
  completedToday: boolean
}

export async function getRotationInfo(
  today: string = new Date().toISOString().split('T')[0]
): Promise<RotationInfo> {
  // completedAt is indexed and IndexedDB does not index null, so this is the
  // most recently finished session (or undefined when nothing is finished).
  const last = await db.workoutSessions.orderBy('completedAt').reverse().first()

  const nextIndex = last ? (ROTATION.indexOf(last.templateId as WorkoutTemplate['id']) + 1) % ROTATION.length : 0
  const nextId = ROTATION[nextIndex]
  const template = workoutTemplates.find((t) => t.id === nextId) ?? workoutTemplates[0]

  const completedCount = await db.workoutSessions.where('completedAt').above('').count()
  const cycleNumber = Math.floor(completedCount / ROTATION.length) + 1

  const completedToday = !!(await db.workoutSessions
    .where('date')
    .equals(today)
    .filter((s) => s.completedAt !== null)
    .first())

  return { template, cycleNumber, completedToday }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
