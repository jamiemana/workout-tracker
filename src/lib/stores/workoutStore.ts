import { create } from 'zustand'
import { db, type LoggedSet, type WorkoutSession } from '../data/db'
import type { ExerciseTemplate } from '../data/templates'
import { useSettingsStore } from './settingsStore'

interface SetInput {
  exerciseId: string
  setNumber: number
  weight: number | null
  reps: number | null
  completed: boolean
  isPR: boolean
  prType: string | null
}

interface WorkoutState {
  activeSession: WorkoutSession | null
  sets: SetInput[]
  restTimerRunning: boolean
  restTimerEnd: number | null

  startSession: (templateId: string, date: string, cycleNumber: number, exercises: ExerciseTemplate[]) => Promise<void>
  loadSession: (sessionId: number) => Promise<void>
  updateSetInput: (exerciseId: string, setNumber: number, field: 'weight' | 'reps', value: number | null) => void
  completeSet: (exerciseId: string, setNumber: number) => Promise<LoggedSet | null>
  markSetPR: (exerciseId: string, setNumber: number, prType: string) => void
  finishWorkout: () => Promise<WorkoutSession | null>
  startRestTimer: (durationSeconds: number) => void
  stopRestTimer: () => void
  clearSession: () => void
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  activeSession: null,
  sets: [],
  restTimerRunning: false,
  restTimerEnd: null,

  startSession: async (templateId, date, cycleNumber, exercises) => {
    const existing = await db.workoutSessions.where({ date, templateId }).first()
    if (existing && existing.id) {
      await get().loadSession(existing.id)
      return
    }

    const sessionId = await db.workoutSessions.add({
      templateId,
      date,
      cycleNumber,
      startedAt: new Date().toISOString(),
      completedAt: null,
      notes: null,
    })

    const session = await db.workoutSessions.get(sessionId)

    // Load previous weights for pre-fill
    const previousSets = await loadPreviousWeights(templateId, exercises)

    const setInputs: SetInput[] = []
    for (const ex of exercises) {
      for (let s = 1; s <= ex.targetSets; s++) {
        const prev = previousSets.find(
          (p) => p.exerciseId === ex.id && p.setNumber === s
        )
        setInputs.push({
          exerciseId: ex.id,
          setNumber: s,
          weight: prev?.weight ?? null,
          reps: prev?.reps ?? null,
          completed: false,
          isPR: false,
          prType: null,
        })
      }
    }

    set({ activeSession: session || null, sets: setInputs })
  },

  loadSession: async (sessionId) => {
    const session = await db.workoutSessions.get(sessionId)
    if (!session) return

    const loggedSets = await db.loggedSets.where({ sessionId }).toArray()
    const prs = await db.personalRecords.where({ sessionId }).toArray()

    const template = (await import('../data/templates')).getTemplateById(session.templateId)
    if (!template) return

    const setInputs: SetInput[] = []
    for (const ex of template.exercises) {
      for (let s = 1; s <= ex.targetSets; s++) {
        const logged = loggedSets.find(
          (l) => l.exerciseId === ex.id && l.setNumber === s
        )
        const pr = logged?.completed
          ? prs.find(
              (p) =>
                p.exerciseId === ex.id &&
                p.weight === logged.weight &&
                p.reps === logged.reps
            )
          : undefined
        setInputs.push({
          exerciseId: ex.id,
          setNumber: s,
          weight: logged?.weight ?? null,
          reps: logged?.reps ?? null,
          completed: logged?.completed ?? false,
          isPR: !!pr,
          prType: pr?.prType ?? null,
        })
      }
    }

    set({ activeSession: session, sets: setInputs })
  },

  updateSetInput: (exerciseId, setNumber, field, value) => {
    set((state) => ({
      sets: state.sets.map((s) =>
        s.exerciseId === exerciseId && s.setNumber === setNumber
          ? { ...s, [field]: value }
          : s
      ),
    }))
  },

  completeSet: async (exerciseId, setNumber) => {
    const { activeSession, sets } = get()
    if (!activeSession?.id) return null

    const setInput = sets.find(
      (s) => s.exerciseId === exerciseId && s.setNumber === setNumber
    )
    if (!setInput || setInput.completed) return null

    const weight = setInput.weight
    const reps = setInput.reps ?? 0
    const isBodyweight = weight === null
    const exerciseUnit =
      useSettingsStore.getState().exerciseUnits[exerciseId] ?? 'kg'

    const loggedSet: LoggedSet = {
      sessionId: activeSession.id,
      exerciseId,
      setNumber,
      weight,
      unit: isBodyweight ? 'bw' : exerciseUnit,
      reps,
      completed: true,
      timestamp: new Date().toISOString(),
    }

    const id = await db.loggedSets.add(loggedSet)
    loggedSet.id = id

    set((state) => ({
      sets: state.sets.map((s) =>
        s.exerciseId === exerciseId && s.setNumber === setNumber
          ? { ...s, completed: true }
          : s
      ),
    }))

    return loggedSet
  },

  markSetPR: (exerciseId, setNumber, prType) => {
    set((state) => ({
      sets: state.sets.map((s) =>
        s.exerciseId === exerciseId && s.setNumber === setNumber
          ? { ...s, isPR: true, prType }
          : s
      ),
    }))
  },

  finishWorkout: async () => {
    const { activeSession } = get()
    if (!activeSession?.id) return null

    const completedAt = new Date().toISOString()
    await db.workoutSessions.update(activeSession.id, { completedAt })

    const updated = await db.workoutSessions.get(activeSession.id)
    set({ activeSession: null, sets: [], restTimerRunning: false, restTimerEnd: null })
    return updated || null
  },

  startRestTimer: (durationSeconds) => {
    set({
      restTimerRunning: true,
      restTimerEnd: Date.now() + durationSeconds * 1000,
    })
  },

  stopRestTimer: () => {
    set({ restTimerRunning: false, restTimerEnd: null })
  },

  clearSession: () => {
    set({ activeSession: null, sets: [], restTimerRunning: false, restTimerEnd: null })
  },
}))

async function loadPreviousWeights(
  templateId: string,
  exercises: ExerciseTemplate[]
): Promise<{ exerciseId: string; setNumber: number; weight: number | null; reps: number }[]> {
  const previousSession = await db.workoutSessions
    .where('templateId')
    .equals(templateId)
    .filter((s) => s.completedAt !== null)
    .reverse()
    .sortBy('date')

  if (!previousSession.length) return []

  const lastSession = previousSession[0]
  if (!lastSession.id) return []

  const sets = await db.loggedSets
    .where('sessionId')
    .equals(lastSession.id)
    .toArray()

  return sets
    .filter((s) => exercises.some((e) => e.id === s.exerciseId))
    .map((s) => ({
      exerciseId: s.exerciseId,
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
    }))
}
