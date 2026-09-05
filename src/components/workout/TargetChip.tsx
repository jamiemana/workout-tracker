import type { ProgressionTarget } from '@/lib/utils/progression'
import { formatLoad } from '@/lib/utils/progression'

export default function TargetChip({ target }: { target: ProgressionTarget | undefined }) {
  if (!target) return null

  let text: string
  let tone: string
  if (target.kind === 'increase' && target.weight !== null && target.unit !== 'bw') {
    text = `↑ ${formatLoad(target.weight, target.unit)}`
    tone = 'bg-accent-lime/15 text-accent-lime'
  } else if (target.kind === 'hold' && target.weight !== null && target.unit !== 'bw') {
    text = `${formatLoad(target.weight, target.unit)} × ${target.reps}`
    tone = 'bg-accent-cyan/15 text-accent-cyan'
  } else {
    text = `${target.reps} reps`
    tone = 'bg-accent-cyan/15 text-accent-cyan'
  }

  return (
    <span
      title="Target for this session"
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-medium ${tone}`}
    >
      {text}
    </span>
  )
}
