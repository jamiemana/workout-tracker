import { useMemo } from 'react'
import type { ExerciseTemplate } from '@/lib/data/templates'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { checkAndRecordPR } from '@/lib/utils/pr'
import SetRow from './SetRow'

interface ExerciseBlockProps {
  exercise: ExerciseTemplate
  templateExerciseId: string
  indented?: boolean
  hideHeader?: boolean
  onSetCompleted: () => void
}

export default function ExerciseBlock({
  exercise,
  templateExerciseId,
  indented,
  hideHeader,
  onSetCompleted,
}: ExerciseBlockProps) {
  const allSets = useWorkoutStore((s) => s.sets)
  const sets = useMemo(
    () => allSets.filter((set) => set.exerciseId === exercise.id),
    [allSets, exercise.id]
  )
  const activeSession = useWorkoutStore((s) => s.activeSession)
  const updateSetInput = useWorkoutStore((s) => s.updateSetInput)
  const completeSet = useWorkoutStore((s) => s.completeSet)
  const uncompleteSet = useWorkoutStore((s) => s.uncompleteSet)
  const markSetPR = useWorkoutStore((s) => s.markSetPR)
  const exerciseUnit = useSettingsStore(
    (s) => s.exerciseUnits[exercise.id] ?? 'kg'
  )
  const setExerciseUnit = useSettingsStore((s) => s.setExerciseUnit)
  const toggleExerciseSwap = useWorkoutStore((s) => s.toggleExerciseSwap)
  const canSwap = !!exercise.alternativeId
  const isSwapped = templateExerciseId !== exercise.id
  const anyCompleted = sets.some((s) => s.completed)

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

  return (
    <div className="space-y-1.5">
      {!hideHeader && (
        <div style={{ marginLeft: indented ? 18 : 0 }}>
          <div className="flex items-center gap-2">
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
              </button>
            )}
          </div>
          <p className="text-xs text-text-tertiary">
            {exercise.targetSets}
            {exercise.targetSetsMax ? `-${exercise.targetSetsMax}` : ''} sets &middot;{' '}
            {exercise.targetReps} reps
          </p>
        </div>
      )}
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
    </div>
  )
}
