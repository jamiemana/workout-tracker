import { useState, useEffect, useCallback, useRef } from 'react'

interface RestTimerState {
  timeLeft: number
  isRunning: boolean
  start: (durationSeconds: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  editDuration: (durationSeconds: number) => void
}

export function useRestTimer(onComplete?: () => void): RestTimerState {
  const [endTime, setEndTime] = useState<number | null>(null)
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!isRunning || !endTime) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)

      if (remaining <= 0) {
        setIsRunning(false)
        setEndTime(null)
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200])
        }
        onCompleteRef.current?.()
      }
    }

    tick()
    const interval = setInterval(tick, 200)
    return () => clearInterval(interval)
  }, [isRunning, endTime])

  const start = useCallback((durationSeconds: number) => {
    setEndTime(Date.now() + durationSeconds * 1000)
    setPausedTimeLeft(null)
    setTimeLeft(durationSeconds)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (endTime) {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setPausedTimeLeft(remaining)
      setIsRunning(false)
      setEndTime(null)
    }
  }, [endTime])

  const resume = useCallback(() => {
    if (pausedTimeLeft !== null && pausedTimeLeft > 0) {
      setEndTime(Date.now() + pausedTimeLeft * 1000)
      setPausedTimeLeft(null)
      setIsRunning(true)
    }
  }, [pausedTimeLeft])

  const stop = useCallback(() => {
    setEndTime(null)
    setPausedTimeLeft(null)
    setTimeLeft(0)
    setIsRunning(false)
  }, [])

  const editDuration = useCallback((durationSeconds: number) => {
    setEndTime(Date.now() + durationSeconds * 1000)
    setTimeLeft(durationSeconds)
    setPausedTimeLeft(null)
    setIsRunning(true)
  }, [])

  return {
    timeLeft: pausedTimeLeft ?? timeLeft,
    isRunning,
    start,
    pause,
    resume,
    stop,
    editDuration,
  }
}
