import type { ExerciseTemplate } from '@/lib/data/templates'
import ExerciseBlock from './ExerciseBlock'

interface SupersetBlockProps {
  exerciseA: ExerciseTemplate
  templateIdA: string
  exerciseB: ExerciseTemplate
  templateIdB: string
  onSetCompleted: () => void
}

export default function SupersetBlock({
  exerciseA,
  templateIdA,
  exerciseB,
  templateIdB,
  onSetCompleted,
}: SupersetBlockProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-sm bg-accent-cyan/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-accent-cyan">
          Superset
        </span>
      </div>

      <ExerciseBlock
        exercise={exerciseA}
        templateExerciseId={templateIdA}
        label="A"
        onSetCompleted={onSetCompleted}
      />

      <div className="my-3 border-t border-border-default" />

      <ExerciseBlock
        exercise={exerciseB}
        templateExerciseId={templateIdB}
        label="B"
        onSetCompleted={onSetCompleted}
      />
    </div>
  )
}
