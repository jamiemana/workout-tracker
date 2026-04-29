import { useState, useRef } from 'react'

interface SetRowProps {
  setNumber: number
  weight: number | null
  reps: number | null
  completed: boolean
  isPR: boolean
  prType: string | null
  isBodyweight: boolean
  targetReps: string
  unitLabel: 'kg' | 'lvl'
  indented?: boolean
  onWeightChange: (value: number | null) => void
  onRepsChange: (value: number | null) => void
  onComplete: () => void
  onToggleUnit: () => void
}

export default function SetRow({
  setNumber,
  weight,
  reps,
  completed,
  isPR,
  prType,
  isBodyweight,
  targetReps,
  unitLabel,
  indented,
  onWeightChange,
  onRepsChange,
  onComplete,
  onToggleUnit,
}: SetRowProps) {
  const [showPRLabel, setShowPRLabel] = useState(false)
  const [animating, setAnimating] = useState(false)
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)

  const handleComplete = () => {
    if (completed) {
      onComplete()
      return
    }
    setAnimating(true)
    onComplete()
    setTimeout(() => setAnimating(false), 200)
  }

  const handlePRShow = (type: string) => {
    setShowPRLabel(true)
    setTimeout(() => setShowPRLabel(false), 2000)
  }

  // Color states
  const isViolet = completed && isPR
  const isLime = completed && !isPR

  const rowBg = isViolet
    ? 'bg-accent-violet-bg'
    : isLime
    ? 'bg-accent-lime-bg'
    : 'bg-bg-tertiary'

  const rowBorder = isViolet
    ? 'border-accent-violet-border'
    : isLime
    ? 'border-accent-lime-border'
    : 'border-border-subtle'

  const badgeColor = isViolet
    ? 'bg-accent-violet text-white'
    : isLime
    ? 'bg-accent-lime text-bg-primary'
    : 'bg-bg-input text-text-secondary'

  const valueColor = isViolet
    ? 'text-accent-violet'
    : isLime
    ? 'text-accent-lime'
    : 'text-text-secondary'

  const unitColor = isViolet
    ? 'text-accent-violet/60'
    : isLime
    ? 'text-accent-lime-muted'
    : 'text-text-muted'

  const checkColor = isViolet
    ? 'text-accent-violet'
    : isLime
    ? 'text-accent-lime'
    : 'text-text-muted'

  const animClass = animating
    ? isViolet
      ? 'animate-violet-flash'
      : 'animate-lime-flash'
    : ''

  return (
    <div
      className={`grid items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${rowBg} ${rowBorder} ${animClass}`}
      style={{
        gridTemplateColumns: '32px 1fr 24px 1fr 36px',
        marginLeft: indented ? 18 : 0,
      }}
    >
      {/* Set badge */}
      <div className="flex items-center justify-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold ${badgeColor}`}
        >
          {setNumber}
        </div>
      </div>

      {/* Weight input */}
      <div className="relative">
        {isBodyweight ? (
          <div className={`flex h-10 items-center rounded-md bg-bg-input px-3 font-mono text-sm ${valueColor}`}>
            BW
          </div>
        ) : (
          <div className="flex items-center">
            <input
              ref={weightRef}
              type="number"
              inputMode="decimal"
              value={weight ?? ''}
              placeholder="0"
              disabled={completed}
              onChange={(e) => {
                const v = e.target.value === '' ? null : parseFloat(e.target.value)
                onWeightChange(v)
              }}
              className={`h-10 w-full rounded-md bg-bg-input px-3 font-mono text-sm ${valueColor} placeholder-text-muted disabled:opacity-70`}
            />
            <button
              type="button"
              onClick={onToggleUnit}
              disabled={completed}
              className={`ml-1 rounded px-1 py-0.5 text-xs uppercase tracking-wide ${unitColor} disabled:opacity-70`}
            >
              {unitLabel}
            </button>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className={`text-center text-sm font-medium ${unitColor}`}>&times;</div>

      {/* Reps input */}
      <div className="flex items-center">
        <input
          ref={repsRef}
          type="number"
          inputMode="numeric"
          value={reps ?? ''}
          placeholder={targetReps}
          disabled={completed}
          onChange={(e) => {
            const v = e.target.value === '' ? null : parseInt(e.target.value)
            onRepsChange(v)
          }}
          className={`h-10 w-full rounded-md bg-bg-input px-3 font-mono text-sm ${valueColor} placeholder-text-muted disabled:opacity-70`}
        />
        <span className={`ml-1 text-xs ${unitColor}`}>reps</span>
      </div>

      {/* Check button — tap when completed to undo */}
      <button
        onClick={handleComplete}
        aria-label={completed ? 'Uncheck set to edit' : 'Mark set complete'}
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
          completed
            ? isViolet
              ? 'border-accent-violet bg-accent-violet'
              : 'border-accent-lime bg-accent-lime'
            : 'border-border-subtle hover:border-text-muted'
        }`}
        style={{ minWidth: 32, minHeight: 32 }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={completed ? '#0A0A0A' : 'currentColor'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={checkColor}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* PR Label overlay */}
      {showPRLabel && prType && (
        <div className="col-span-5 mt-1 text-center text-xs font-medium text-accent-violet animate-fade-in">
          {prType === 'weight' ? 'Weight PR' : prType === 'rep' ? 'Rep PR' : 'Volume PR'}
        </div>
      )}
    </div>
  )
}
