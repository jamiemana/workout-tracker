import { useEffect, useState, useCallback, useRef } from 'react'
import { useRotation } from '@/lib/hooks/useRotation'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { useRestTimer } from '@/lib/hooks/useRestTimer'
import { getSessionStats } from '@/lib/utils/volume'
import { triggerAutoBackup } from '@/lib/utils/backup'
import { workoutTemplates, type ExerciseTemplate } from '@/lib/data/templates'
import ExerciseBlock from '@/components/workout/ExerciseBlock'
import SupersetBlock from '@/components/workout/SupersetBlock'
import CompletionSummary from '@/components/workout/CompletionSummary'
import Header from '@/components/layout/Header'
import { formatDate } from '@/lib/utils/rotation'

export default function Today() {
  const todayInfo = useRotation()
  const activeSession = useWorkoutStore((s) => s.activeSession)
  const sets = useWorkoutStore((s) => s.sets)
  const startSession = useWorkoutStore((s) => s.startSession)
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout)
  const clearSession = useWorkoutStore((s) => s.clearSession)
  const restTimerDefault = useSettingsStore((s) => s.restTimerDefault)
  const autoBackup = useSettingsStore((s) => s.autoBackup)
  const sessionStarted = useRef(false)

  const [showCompletion, setShowCompletion] = useState(false)
  const [workoutFinished, setWorkoutFinished] = useState(false)
  const [overrideTemplateId, setOverrideTemplateId] = useState<string | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [stats, setStats] = useState<{
    totalVolume: number
    prCount: number
    durationMinutes: number
  } | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(restTimerDefault)

  const timer = useRestTimer()

  // Determine which template to use (override or rotation)
  const effectiveTemplate = overrideTemplateId
    ? workoutTemplates.find((t) => t.id === overrideTemplateId) ?? todayInfo?.template
    : todayInfo?.template

  // Auto-start session when we have a template to work out (today's rotation or an override)
  useEffect(() => {
    if (workoutFinished) return
    if (todayInfo && effectiveTemplate && !activeSession && !sessionStarted.current) {
      sessionStarted.current = true
      const today = new Date().toISOString().split('T')[0]
      startSession(
        effectiveTemplate.id,
        today,
        todayInfo.cycleNumber,
        effectiveTemplate.exercises
      )
    }
  }, [todayInfo, activeSession, startSession, workoutFinished, effectiveTemplate])

  const handleSetCompleted = useCallback(() => {
    timer.start(restTimerDefault)
    setTimerActive(true)
  }, [timer, restTimerDefault])

  // Check if all sets completed
  useEffect(() => {
    if (sets.length > 0 && sets.every((s) => s.completed)) {
      const t = setTimeout(async () => {
        if (activeSession?.id) {
          const s = await getSessionStats(activeSession.id)
          if (s) {
            setStats({
              totalVolume: s.totalVolume,
              prCount: s.prCount,
              durationMinutes: s.durationMinutes,
            })
          }
        }
        setShowCompletion(true)
      }, 500)
      return () => clearTimeout(t)
    }
  }, [sets, activeSession])

  const handleFinish = async () => {
    const session = await finishWorkout()
    setShowCompletion(false)
    setWorkoutFinished(true)
    timer.stop()
    setTimerActive(false)

    if (autoBackup && session) {
      setTimeout(() => triggerAutoBackup(), 500)
    }
  }

  const handleSwitchWorkout = (templateId: string) => {
    clearSession()
    sessionStarted.current = false
    setWorkoutFinished(false)
    setOverrideTemplateId(templateId)
    setShowSwitcher(false)
  }

  if (!todayInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    )
  }

  // Finished workout or rest day
  if ((todayInfo.isRestDay && !overrideTemplateId) || workoutFinished) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {workoutFinished ? (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-lime/15">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-lime">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">Done for today</h1>
              <p className="text-sm text-text-tertiary mb-6">Nice work. Rest up.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold text-text-primary mb-4">Rest Day</h1>
              {todayInfo.nextWorkout && (
                <p className="text-sm text-text-tertiary mb-6">
                  Next up: <span className="text-text-secondary">{todayInfo.nextWorkout.template.name}</span>{' '}
                  &middot; {formatDate(todayInfo.nextWorkout.date)}
                </p>
              )}
            </>
          )}

          {/* Switch workout button */}
          <button
            onClick={() => setShowSwitcher(true)}
            className="rounded-lg border border-border-subtle bg-bg-secondary px-5 py-2.5 text-sm font-medium text-text-secondary"
          >
            Start a different workout
          </button>

          {/* Workout switcher */}
          {showSwitcher && (
            <div className="mt-4 w-full max-w-xs space-y-2">
              {workoutTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSwitchWorkout(t.id)}
                  className="w-full rounded-lg border border-border-default bg-bg-tertiary px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-input"
                >
                  {t.name}
                </button>
              ))}
              <button
                onClick={() => setShowSwitcher(false)}
                className="w-full rounded-lg px-4 py-2 text-xs text-text-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const template = effectiveTemplate
  if (!template) return null

  const blocks = buildExerciseBlocks(template.exercises)

  const minutes = Math.floor(timer.timeLeft / 60)
  const seconds = timer.timeLeft % 60
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-bg-primary pb-32">
      <Header />

      <div className="px-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
              Today&apos;s Workout
            </p>
            <h1 className="mt-1 text-[22px] font-semibold text-text-primary">
              {template.name}
            </h1>
            <p className="text-xs text-text-tertiary">
              Cycle {todayInfo.cycleNumber} &middot;{' '}
              {formatDate(new Date())}
            </p>
          </div>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="mt-1 rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-secondary"
          >
            Switch
          </button>
        </div>

        {/* Workout switcher dropdown */}
        {showSwitcher && (
          <div className="mt-3 space-y-1.5 rounded-xl border border-border-default bg-bg-secondary p-3">
            {workoutTemplates
              .filter((t) => t.id !== template.id)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSwitchWorkout(t.id)}
                  className="w-full rounded-lg bg-bg-tertiary px-4 py-2.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-input"
                >
                  {t.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="px-4 space-y-5">
        {blocks.map((block, i) => (
          <div key={i}>
            {block.type === 'superset' ? (
              <SupersetBlock
                exerciseA={block.exerciseA!}
                exerciseB={block.exerciseB!}
                onSetCompleted={handleSetCompleted}
              />
            ) : (
              <div className="border-t border-border-default pt-4 first:border-t-0 first:pt-0">
                <ExerciseBlock
                  exercise={block.exercise!}
                  onSetCompleted={handleSetCompleted}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rest timer */}
      {(timerActive || timer.isRunning || timer.timeLeft > 0) && (
        <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-border-default bg-bg-secondary/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-coral">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-mono text-xl font-semibold text-text-primary">
                {timerDisplay}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editValue}
                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                    className="h-8 w-16 rounded-md bg-bg-input px-2 text-center font-mono text-sm text-text-primary"
                  />
                  <span className="text-xs text-text-tertiary">sec</span>
                  <button
                    onClick={() => {
                      timer.editDuration(editValue)
                      setEditing(false)
                    }}
                    className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-primary"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={timer.isRunning ? timer.pause : timer.resume}
                    className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-secondary"
                  >
                    {timer.isRunning ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => { timer.stop(); setTimerActive(false) }}
                    className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-muted"
                  >
                    &times;
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion summary */}
      {showCompletion && stats && (
        <CompletionSummary
          totalVolume={stats.totalVolume}
          prCount={stats.prCount}
          durationMinutes={stats.durationMinutes}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}

interface ExerciseBlock {
  type: 'standalone' | 'superset'
  exercise?: ExerciseTemplate
  exerciseA?: ExerciseTemplate
  exerciseB?: ExerciseTemplate
}

function buildExerciseBlocks(exercises: ExerciseTemplate[]): ExerciseBlock[] {
  const blocks: ExerciseBlock[] = []
  const processedGroups = new Set<string>()

  for (const ex of exercises) {
    if (ex.supersetGroup) {
      if (processedGroups.has(ex.supersetGroup)) continue
      processedGroups.add(ex.supersetGroup)

      const a = exercises.find(
        (e) => e.supersetGroup === ex.supersetGroup && e.supersetPosition === 'a'
      )
      const b = exercises.find(
        (e) => e.supersetGroup === ex.supersetGroup && e.supersetPosition === 'b'
      )

      if (a && b) {
        blocks.push({ type: 'superset', exerciseA: a, exerciseB: b })
      }
    } else {
      blocks.push({ type: 'standalone', exercise: ex })
    }
  }

  return blocks
}
