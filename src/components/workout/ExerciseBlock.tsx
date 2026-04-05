import { useMemo } from 'react'
import type { ExerciseTemplate } from '@/lib/data/templates'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { checkAndRecordPR } from '@/lib/utils/pr'
import SetRow from './SetRow'

interface ExerciseBlockProps {
  exercise: ExerciseTemplate
  indented?: boolean
  hideHeader?: boolean
  onSetCompleted: () => void
}

export default function ExerciseBlock({
  exercise,
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
  const markSetPR = useWorkoutStore((s) => s.markSetPR)

  const handleComplete = async (setNumber: number) => {
    const setInput = sets.find((s) => s.setNumber === setNumber)
    if (!setInput || !activeSession?.id) return

    const logged = await completeSet(exercise.id, setNumber)
    if (!logged) return

    // Check for PR
    const result = await checkAndRecordPR(
      exercise.id,
      logged.weight,
      logged.reps,
      activeSession.id,
      activeSession.date
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
          <h3 className="text-[15px] font-medium text-text-primary">
            {exercise.name}
          </h3>
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
            indented={indented}
            onWeightChange={(v) =>
              updateSetInput(exercise.id, s.setNumber, 'weight', v)
            }
            onRepsChange={(v) =>
              updateSetInput(exercise.id, s.setNumber, 'reps', v)
            }
            onComplete={() => handleComplete(s.setNumber)}
          />
        ))}
      </div>
    </div>
  )
}
