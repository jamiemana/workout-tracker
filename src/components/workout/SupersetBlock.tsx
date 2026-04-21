import type { ExerciseTemplate } from '@/lib/data/templates'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import ExerciseBlock from './ExerciseBlock'

interface SupersetBlockProps {
  exerciseA: ExerciseTemplate
  templateIdA: string
  exerciseB: ExerciseTemplate
  templateIdB: string
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

function SupersetMemberHeader({
  label,
  exercise,
  templateId,
  anyCompleted,
}: {
  label: 'A' | 'B'
  exercise: ExerciseTemplate
  templateId: string
  anyCompleted: boolean
}) {
  const toggleExerciseSwap = useWorkoutStore((s) => s.toggleExerciseSwap)
  const canSwap = !!exercise.alternativeId
  const isSwapped = templateId !== exercise.id

  return (
    <div className="mb-1.5" style={{ paddingLeft: 18 }}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan/20 text-[10px] font-bold text-accent-cyan">
          {label}
        </span>
        <span className="text-[15px] font-medium text-text-primary">
          {exercise.name}
        </span>
        {canSwap && (
          <button
            type="button"
            onClick={() => toggleExerciseSwap(templateId)}
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
      <p className="text-xs text-text-tertiary pl-7">
        {exercise.targetSets}
        {exercise.targetSetsMax ? `-${exercise.targetSetsMax}` : ''} sets &middot;{' '}
        {exercise.targetReps} reps
      </p>
    </div>
  )
}

export default function SupersetBlock({
  exerciseA,
  templateIdA,
  exerciseB,
  templateIdB,
  onSetCompleted,
}: SupersetBlockProps) {
  const sets = useWorkoutStore((s) => s.sets)
  const anyCompletedA = sets.some(
    (s) => s.exerciseId === exerciseA.id && s.completed
  )
  const anyCompletedB = sets.some(
    (s) => s.exerciseId === exerciseB.id && s.completed
  )

  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-accent-cyan/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-accent-cyan">
          Superset
        </span>
      </div>

      <SupersetMemberHeader
        label="A"
        exercise={exerciseA}
        templateId={templateIdA}
        anyCompleted={anyCompletedA}
      />
      <ExerciseBlock
        exercise={exerciseA}
        templateExerciseId={templateIdA}
        indented
        hideHeader
        onSetCompleted={onSetCompleted}
      />

      <div className="my-3 border-t border-border-default" />

      <SupersetMemberHeader
        label="B"
        exercise={exerciseB}
        templateId={templateIdB}
        anyCompleted={anyCompletedB}
      />
      <ExerciseBlock
        exercise={exerciseB}
        templateExerciseId={templateIdB}
        indented
        hideHeader
        onSetCompleted={onSetCompleted}
      />
    </div>
  )
}
