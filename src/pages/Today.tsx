import { useEffect, useState, useCallback, useRef } from 'react'
import { useRotation } from '@/lib/hooks/useRotation'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { useRestTimer } from '@/lib/hooks/useRestTimer'
import { getSessionStats } from '@/lib/utils/volume'
import { triggerAutoBackup } from '@/lib/utils/backup'
import type { ExerciseTemplate } from '@/lib/data/templates'
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
  const restTimerDefault = useSettingsStore((s) => s.restTimerDefault)
  const autoBackup = useSettingsStore((s) => s.autoBackup)
  const sessionStarted = useRef(false)

  const [showCompletion, setShowCompletion] = useState(false)
  const [stats, setStats] = useState<{
    totalVolume: number
    prCount: number
    durationMinutes: number
  } | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(restTimerDefault)

  const timer = useRestTimer()

  // Auto-start session when on workout day
  useEffect(() => {
    if (todayInfo && !todayInfo.isRestDay && todayInfo.template && !activeSession && !sessionStarted.current) {
      sessionStarted.current = true
      const today = new Date().toISOString().split('T')[0]
      startSession(
        todayInfo.templateId!,
        today,
        todayInfo.cycleNumber,
        todayInfo.template.exercises
      )
    }
  }, [todayInfo, activeSession, startSession])

  const handleSetCompleted = useCallback(() => {
    timer.start(restTimerDefault)
    setTimerActive(true)
  }, [timer, restTimerDefault])

  // Check if all sets completed
  useEffect(() => {
    if (sets.length > 0 && sets.every((s) => s.completed)) {
      // Small delay to let the last animation play
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
    timer.stop()
    setTimerActive(false)

    if (autoBackup && session) {
      setTimeout(() => triggerAutoBackup(), 500)
    }
  }

  if (!todayInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    )
  }

  // Rest day
  if (todayInfo.isRestDay) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <h1 className="text-3xl font-semibold text-text-primary mb-4">Rest Day</h1>
          {todayInfo.nextWorkout && (
            <p className="text-sm text-text-tertiary">
              Next up: <span className="text-text-secondary">{todayInfo.nextWorkout.template.name}</span>{' '}
              &middot; {formatDate(todayInfo.nextWorkout.date)}
            </p>
          )}
        </div>
      </div>
    )
  }

  const template = todayInfo.template
  if (!template) return null

  // Group exercises into blocks (standalone or superset)
  const blocks = buildExerciseBlocks(template.exercises)

  const minutes = Math.floor(timer.timeLeft / 60)
  const seconds = timer.timeLeft % 60
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-bg-primary pb-32">
      <Header />

      <div className="px-4 pb-4">
        {/* Header area */}
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
