import { create } from 'zustand'
import { db, type LoggedSet, type WorkoutSession } from '../data/db'
import { toKg } from '../data/units'
import {
  applyExerciseSwaps,
  getExerciseById,
  getTemplateById,
  type ExerciseTemplate,
} from '../data/templates'
import { useSettingsStore, isDeloadActive } from './settingsStore'
import { computeTarget, type ProgressionTarget } from '../utils/progression'

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
  /** Suggested load/reps per exercise for this session, from the previous one. */
  targets: Record<string, ProgressionTarget>
  restTimerRunning: boolean
  restTimerEnd: number | null

  startSession: (templateId: string, date: string, cycleNumber: number, exercises: ExerciseTemplate[]) => Promise<void>
  loadSession: (sessionId: number) => Promise<void>
  updateSetInput: (exerciseId: string, setNumber: number, field: 'weight' | 'reps', value: number | null) => void
  completeSet: (exerciseId: string, setNumber: number) => Promise<LoggedSet | null>
  uncompleteSet: (exerciseId: string, setNumber: number) => Promise<void>
  markSetPR: (exerciseId: string, setNumber: number, prType: string) => void
  toggleExerciseSwap: (templateExerciseId: string) => Promise<void>
  finishWorkout: () => Promise<WorkoutSession | null>
  startRestTimer: (durationSeconds: number) => void
  stopRestTimer: () => void
  clearSession: () => void
}

async function buildSetInputs(
  sessionId: number,
  exercises: ExerciseTemplate[],
  deload = false
): Promise<{ inputs: SetInput[]; targets: Record<string, ProgressionTarget> }> {
  const loggedSets = await db.loggedSets.where({ sessionId }).toArray()
  const prs = await db.personalRecords.where({ sessionId }).toArray()
  const previous = await loadPreviousSets(sessionId, exercises)
  const settings = useSettingsStore.getState()

  const inputs: SetInput[] = []
  const targets: Record<string, ProgressionTarget> = {}
  for (const ex of exercises) {
    const prevForEx = previous[ex.id]?.sets ?? []
    const unit = settings.exerciseUnits[ex.id] ?? 'kg'
    const declined =
      previous[ex.id] !== undefined &&
      settings.declinedIncrease[ex.id] === previous[ex.id].sessionId
    const target = computeTarget(ex, prevForEx, unit, declined, deload)
    if (target) targets[ex.id] = target

    // Deload: one set fewer per working exercise; one- and two-set
    // exercises (abs, OHP) keep their count.
    const setCount =
      deload && !ex.warmup && ex.targetSets > 2 ? ex.targetSets - 1 : ex.targetSets
    for (let s = 1; s <= setCount; s++) {
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
      // A set beyond last time's count (e.g. after a short session) takes
      // the last set that was logged.
      const prev =
        prevForEx.find((p) => p.setNumber === s) ?? prevForEx[prevForEx.length - 1]
      // When progressing (or deloading) load, prefill every set with the new working weight.
      const suggested =
        target?.kind === 'increase' || target?.kind === 'deload'
          ? target.weight
          : prev?.weight ?? null
      inputs.push({
        exerciseId: ex.id,
        setNumber: s,
        weight: logged?.weight ?? suggested,
        reps: logged?.reps ?? prev?.reps ?? null,
        completed: logged?.completed ?? false,
        isPR: !!pr,
        prType: pr?.prType ?? null,
      })
    }
  }
  return { inputs, targets }
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  activeSession: null,
  sets: [],
  targets: {},
  restTimerRunning: false,
  restTimerEnd: null,

  startSession: async (templateId, date, cycleNumber, exercises) => {
    const existing = await db.workoutSessions.where({ date, templateId }).first()
    if (existing && existing.id) {
      await get().loadSession(existing.id)
      return
    }

    const deload = isDeloadActive(useSettingsStore.getState().deloadStartedAt, date)
    const sessionId = (await db.workoutSessions.add({
      templateId,
      date,
      cycleNumber,
      startedAt: new Date().toISOString(),
      completedAt: null,
      notes: null,
      exerciseSwaps: {},
      deload,
    })) as number

    const session = await db.workoutSessions.get(sessionId)
    const { inputs, targets } = await buildSetInputs(sessionId, exercises, deload)

    set({ activeSession: session || null, sets: inputs, targets })
  },

  loadSession: async (sessionId) => {
    const session = await db.workoutSessions.get(sessionId)
    if (!session) return

    const template = getTemplateById(session.templateId)
    if (!template) return

    const effectiveExercises = applyExerciseSwaps(
      template.exercises,
      session.exerciseSwaps
    )
    const { inputs, targets } = await buildSetInputs(
      sessionId,
      effectiveExercises,
      !!session.deload
    )

    set({ activeSession: session, sets: inputs, targets })
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

    const unit = isBodyweight ? 'bw' : exerciseUnit
    const loggedSet: LoggedSet = {
      sessionId: activeSession.id,
      exerciseId,
      setNumber,
      weight,
      unit,
      weightKg: toKg(weight, unit),
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

  uncompleteSet: async (exerciseId, setNumber) => {
    const { activeSession } = get()
    if (!activeSession?.id) return

    const sessionId = activeSession.id
    const logged = await db.loggedSets
      .where({ sessionId, exerciseId, setNumber })
      .first()
    if (!logged?.id) return

    await db.loggedSets.delete(logged.id)

    if (logged.weight !== null) {
      const stalePRs = await db.personalRecords
        .where({ sessionId, exerciseId })
        .filter((p) => p.weight === logged.weight && p.reps === logged.reps)
        .toArray()
      for (const p of stalePRs) {
        if (p.id !== undefined) await db.personalRecords.delete(p.id)
      }
    }

    set((state) => ({
      sets: state.sets.map((s) =>
        s.exerciseId === exerciseId && s.setNumber === setNumber
          ? { ...s, completed: false, isPR: false, prType: null }
          : s
      ),
    }))
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

  toggleExerciseSwap: async (templateExerciseId) => {
    const { activeSession } = get()
    if (!activeSession?.id) return

    const template = getTemplateById(activeSession.templateId)
    if (!template) return

    const templateEx = template.exercises.find(
      (e) => e.id === templateExerciseId
    )
    if (!templateEx?.alternativeId) return

    const currentId =
      activeSession.exerciseSwaps?.[templateExerciseId] ?? templateExerciseId
    const currentEx = getExerciseById(currentId) ?? templateEx
    const nextId = currentEx.alternativeId ?? templateExerciseId

    const nextSwaps = { ...(activeSession.exerciseSwaps ?? {}) }
    if (nextId === templateExerciseId) {
      delete nextSwaps[templateExerciseId]
    } else {
      nextSwaps[templateExerciseId] = nextId
    }

    await db.workoutSessions.update(activeSession.id, {
      exerciseSwaps: nextSwaps,
    })
    const updated = await db.workoutSessions.get(activeSession.id)
    if (!updated) return

    const effectiveExercises = applyExerciseSwaps(
      template.exercises,
      updated.exerciseSwaps
    )
    const { inputs, targets } = await buildSetInputs(
      activeSession.id,
      effectiveExercises,
      !!updated.deload
    )

    set({ activeSession: updated, sets: inputs, targets })
  },

  finishWorkout: async () => {
    const { activeSession } = get()
    if (!activeSession?.id) return null

    const completedAt = new Date().toISOString()
    await db.workoutSessions.update(activeSession.id, { completedAt })

    const updated = await db.workoutSessions.get(activeSession.id)
    set({ activeSession: null, sets: [], targets: {}, restTimerRunning: false, restTimerEnd: null })
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
    set({ activeSession: null, sets: [], targets: {}, restTimerRunning: false, restTimerEnd: null })
  },
}))

interface PreviousSets {
  /** The session these sets were logged in. */
  sessionId: number
  /** Completed sets in set order. */
  sets: { setNumber: number; weight: number | null; reps: number }[]
}

/**
 * For each exercise, the sets from the last session it was trained in,
 * whichever workout that was: shared movements appear on two days, and
 * exercises have moved between days as the program changed. The current
 * session is skipped, as are deload sessions so the week after picks up from
 * the last normal session rather than the lightened one.
 */
async function loadPreviousSets(
  currentSessionId: number,
  exercises: ExerciseTemplate[]
): Promise<Record<string, PreviousSets>> {
  const sessions = await db.workoutSessions.toArray()
  const eligible = new Map(
    sessions
      .filter((s) => s.id !== undefined && s.id !== currentSessionId && !s.deload)
      .map((s) => [s.id as number, s])
  )

  const out: Record<string, PreviousSets> = {}
  for (const ex of exercises) {
    const logged = await db.loggedSets
      .where('exerciseId')
      .equals(ex.id)
      .filter((s) => s.completed && eligible.has(s.sessionId))
      .toArray()
    if (logged.length === 0) continue

    let latest = eligible.get(logged[0].sessionId)!
    for (const s of logged) {
      const session = eligible.get(s.sessionId)!
      if (
        session.date > latest.date ||
        (session.date === latest.date && session.startedAt > latest.startedAt)
      ) {
        latest = session
      }
    }
    out[ex.id] = {
      sessionId: latest.id as number,
      sets: logged
        .filter((s) => s.sessionId === latest.id)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
    }
  }
  return out
}
