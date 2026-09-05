import { useMemo } from 'react'
import type { ExerciseTemplate } from '@/lib/data/templates'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { checkAndRecordPR } from '@/lib/utils/pr'
import { computeTarget } from '@/lib/utils/progression'
import SetRow from './SetRow'
import TargetChip from './TargetChip'

interface ExerciseBlockProps {
  exercise: ExerciseTemplate
  templateExerciseId: string
  /** Superset position badge; also indents the block. */
  label?: 'A' | 'B'
  onSetCompleted: () => void
}

function SwapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

export default function ExerciseBlock({
  exercise,
  templateExerciseId,
  label,
  onSetCompleted,
}: ExerciseBlockProps) {
  const indented = !!label
  const allSets = useWorkoutStore((s) => s.sets)
  const sets = useMemo(
    () => allSets.filter((set) => set.exerciseId === exercise.id),
    [allSets, exercise.id]
  )
  const activeSession = useWorkoutStore((s) => s.activeSession)
  const target = useWorkoutStore((s) => s.targets[exercise.id])
  const updateSetInput = useWorkoutStore((s) => s.updateSetInput)
  const completeSet = useWorkoutStore((s) => s.completeSet)
  const uncompleteSet = useWorkoutStore((s) => s.uncompleteSet)
  const markSetPR = useWorkoutStore((s) => s.markSetPR)
  const toggleExerciseSwap = useWorkoutStore((s) => s.toggleExerciseSwap)
  const exerciseUnit = useSettingsStore(
    (s) => s.exerciseUnits[exercise.id] ?? 'kg'
  )
  const setExerciseUnit = useSettingsStore((s) => s.setExerciseUnit)
  const declinedOn = useSettingsStore((s) => s.declinedIncrease[exercise.id])
  const setDeclinedIncrease = useSettingsStore((s) => s.setDeclinedIncrease)

  const canSwap = !!exercise.alternativeId
  const isSwapped = templateExerciseId !== exercise.id
  const anyCompleted = sets.some((s) => s.completed)
  const allCompleted = sets.length > 0 && sets.every((s) => s.completed)

  // What next session would get from today's sets, before any veto.
  const nextTime = useMemo(() => {
    if (!allCompleted) return null
    return computeTarget(
      exercise,
      sets.map((s) => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps ?? 0 })),
      exerciseUnit
    )
  }, [allCompleted, sets, exercise, exerciseUnit])
  const increaseAccepted =
    !!activeSession && declinedOn !== activeSession.date

  const handleToggleComplete = async (setNumber: number) => {
    const setInput = sets.find((s) => s.setNumber === setNumber)
    if (!setInput || !activeSession?.id) return

    if (setInput.completed) {
      await uncompleteSet(exercise.id, setNumber)
      return
    }

    const logged = await completeSet(exercise.id, setNumber)
    if (!logged || logged.id === undefined) return

    const result = await checkAndRecordPR(
      exercise.id,
      logged.weight,
      logged.reps,
      activeSession.id,
      activeSession.date,
      logged.id
    )

    if (result.isPR && result.prType) {
      markSetPR(exercise.id, setNumber, result.prType)
    }

    onSetCompleted()
  }

  const handleToggleIncrease = () => {
    if (!activeSession) return
    setDeclinedIncrease(exercise.id, increaseAccepted ? activeSession.date : null)
  }

  return (
    <div className="space-y-1.5">
      <div style={{ marginLeft: indented ? 18 : 0 }}>
        <div className="flex items-center gap-2">
          {label && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan/20 text-[10px] font-bold text-accent-cyan">
              {label}
            </span>
          )}
          <h3 className="text-[15px] font-medium text-text-primary">
            {exercise.name}
          </h3>
          {canSwap && (
            <button
              type="button"
              onClick={() => toggleExerciseSwap(templateExerciseId)}
              disabled={anyCompleted}
              aria-label="Swap variant"
              className={`flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors disabled:opacity-40 ${
                isSwapped
                  ? 'bg-accent-cyan/15 text-accent-cyan'
                  : 'hover:bg-bg-input'
              }`}
            >
              <SwapIcon />
            </button>
          )}
        </div>
        <p
          className={`flex items-center gap-2 text-xs text-text-tertiary ${label ? 'pl-7' : ''}`}
        >
          <span>
            {exercise.targetSets}
            {exercise.targetSetsMax ? `-${exercise.targetSetsMax}` : ''} sets &middot;{' '}
            {exercise.targetReps} reps
          </span>
          <TargetChip target={target} />
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {sets.map((s) => (
          <SetRow
            key={`${exercise.id}-${s.setNumber}`}
            setNumber={s.setNumber}
            weight={s.weight}
            reps={s.reps}
            completed={s.completed}
            isPR={s.isPR}
            prType={s.prType}
            isBodyweight={exercise.isBodyweight || false}
            targetReps={exercise.targetReps}
            unitLabel={exerciseUnit}
            indented={indented}
            onWeightChange={(v) =>
              updateSetInput(exercise.id, s.setNumber, 'weight', v)
            }
            onRepsChange={(v) =>
              updateSetInput(exercise.id, s.setNumber, 'reps', v)
            }
            onComplete={() => handleToggleComplete(s.setNumber)}
            onToggleUnit={() =>
              setExerciseUnit(exercise.id, exerciseUnit === 'kg' ? 'lvl' : 'kg')
            }
          />
        ))}
      </div>

      {nextTime?.kind === 'increase' && nextTime.unit !== 'bw' && (
        <div
          className="flex items-center justify-between rounded-lg bg-bg-input px-3 py-2"
          style={{ marginLeft: indented ? 18 : 0 }}
        >
          <span className="flex items-center gap-2 text-xs text-text-tertiary">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full ${
                increaseAccepted ? 'bg-accent-lime/20 text-accent-lime' : 'bg-bg-tertiary text-text-muted'
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
            <span>
              <span className={increaseAccepted ? 'font-medium text-accent-lime' : 'text-text-muted line-through'}>
                {nextTime.unit === 'lvl' ? `+${nextTime.increment} level` : `+${nextTime.increment} kg`}
              </span>{' '}
              next time
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={increaseAccepted}
            aria-label="Add load next time"
            onClick={handleToggleIncrease}
            className={`relative h-6 w-10 rounded-full transition-colors ${
              increaseAccepted ? 'bg-accent-lime' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                increaseAccepted ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  )
}
