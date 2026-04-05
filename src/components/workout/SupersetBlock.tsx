import type { ExerciseTemplate } from '@/lib/data/templates'
import ExerciseBlock from './ExerciseBlock'

interface SupersetBlockProps {
  exerciseA: ExerciseTemplate
  exerciseB: ExerciseTemplate
  onSetCompleted: () => void
}

export default function SupersetBlock({
  exerciseA,
  exerciseB,
  onSetCompleted,
}: SupersetBlockProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-accent-cyan/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-accent-cyan">
          Superset
        </span>
      </div>

      <div className="mb-1.5" style={{ paddingLeft: 18 }}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan/20 text-[10px] font-bold text-accent-cyan">
            A
          </span>
          <span className="text-[15px] font-medium text-text-primary">{exerciseA.name}</span>
        </div>
        <p className="text-xs text-text-tertiary pl-7">
          {exerciseA.targetSets}{exerciseA.targetSetsMax ? `-${exerciseA.targetSetsMax}` : ''} sets &middot; {exerciseA.targetReps} reps
        </p>
      </div>
      <ExerciseBlock
        exercise={exerciseA}
        indented
        hideHeader
        onSetCompleted={onSetCompleted}
      />

      <div className="my-3 border-t border-border-default" />

      <div className="mb-1.5" style={{ paddingLeft: 18 }}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan/20 text-[10px] font-bold text-accent-cyan">
            B
          </span>
          <span className="text-[15px] font-medium text-text-primary">{exerciseB.name}</span>
        </div>
        <p className="text-xs text-text-tertiary pl-7">
          {exerciseB.targetSets}{exerciseB.targetSetsMax ? `-${exerciseB.targetSetsMax}` : ''} sets &middot; {exerciseB.targetReps} reps
        </p>
      </div>
      <ExerciseBlock
        exercise={exerciseB}
        indented
        hideHeader
        onSetCompleted={onSetCompleted}
      />
    </div>
  )
}
