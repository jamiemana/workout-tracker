import { useState } from 'react'
import { useRestTimer } from '@/lib/hooks/useRestTimer'

interface RestTimerProps {
  defaultDuration: number
  active: boolean
  onTimerStart: () => void
}

export default function RestTimer({
  defaultDuration,
  active,
  onTimerStart,
}: RestTimerProps) {
  const { timeLeft, isRunning, start, pause, resume, stop, editDuration } =
    useRestTimer()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(defaultDuration)

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const startTimer = () => {
    start(defaultDuration)
    onTimerStart()
  }

  if (!active && !isRunning && timeLeft === 0) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-border-default bg-bg-secondary/95 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {/* Clock icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-coral"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>

          {/* Timer display */}
          <span className="font-mono text-xl font-semibold text-text-primary">
            {display}
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
                  editDuration(editValue)
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
                onClick={isRunning ? pause : resume}
                className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-secondary"
              >
                {isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={stop}
                className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-text-muted"
              >
                &times;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Export a simplified trigger hook
export function useRestTimerTrigger(defaultDuration: number) {
  const timer = useRestTimer()
  return {
    ...timer,
    trigger: () => timer.start(defaultDuration),
  }
}
