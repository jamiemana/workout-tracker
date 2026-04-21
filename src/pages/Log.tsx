import { useEffect, useState } from 'react'
import { db, type WorkoutSession, type LoggedSet } from '@/lib/data/db'
import { getTemplateById } from '@/lib/data/templates'
import { formatDate } from '@/lib/utils/rotation'
import Header from '@/components/layout/Header'

interface SessionWithDetails extends WorkoutSession {
  sets: LoggedSet[]
  totalVolume: number
  durationMinutes: number
  prCount: number
}

type Filter = 'all' | 'push' | 'pull'

export default function Log() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    const allSessions = await db.workoutSessions
      .filter((s) => s.completedAt !== null)
      .reverse()
      .sortBy('date')

    const detailed: SessionWithDetails[] = []
    for (const session of allSessions) {
      if (!session.id) continue
      const sets = await db.loggedSets.where('sessionId').equals(session.id).toArray()
      const prs = await db.personalRecords.where('sessionId').equals(session.id).toArray()

      // Only kg sets contribute to total volume — lvl and bw don't combine meaningfully.
      const totalVolume = sets
        .filter((s) => s.completed && s.unit === 'kg')
        .reduce((t, s) => t + (s.weight ?? 0) * s.reps, 0)

      let durationMinutes = 0
      if (session.startedAt && session.completedAt) {
        durationMinutes = Math.round(
          (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
        )
      }

      detailed.push({
        ...session,
        sets,
        totalVolume,
        durationMinutes,
        prCount: prs.length,
      })
    }

    setSessions(detailed)
    setLoading(false)
  }

  const filtered = sessions.filter((s) => {
    if (filter === 'all') return true
    return s.templateId.startsWith(filter)
  })

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <Header />
      <div className="px-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
          History
        </p>
        <h1 className="mt-1 mb-4 text-[22px] font-semibold text-text-primary">
          Workout Log
        </h1>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(['all', 'push', 'pull'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-accent-lime/15 text-accent-lime'
                  : 'bg-bg-input text-text-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-text-tertiary">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-tertiary">No completed workouts yet.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((session) => {
              const template = getTemplateById(session.templateId)
              const isExpanded = expandedId === session.id

              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : session.id ?? null)
                    }
                    className="w-full px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {template?.name ?? session.templateId}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {formatDate(session.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="font-mono text-sm text-text-secondary">
                            {session.totalVolume.toLocaleString()} kg
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {session.durationMinutes}min
                            {session.prCount > 0 && (
                              <span className="ml-2 text-accent-violet">
                                {session.prCount} PR{session.prCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </p>
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`text-text-muted transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {isExpanded && template && (
                    <div className="border-t border-border-default px-4 py-3 space-y-3">
                      {template.exercises.map((ex) => {
                        const exSets = session.sets
                          .filter((s) => s.exerciseId === ex.id && s.completed)
                          .sort((a, b) => a.setNumber - b.setNumber)

                        if (exSets.length === 0) return null

                        return (
                          <div key={ex.id}>
                            <p className="text-xs font-medium text-text-secondary mb-1">
                              {ex.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {exSets.map((s) => (
                                <span
                                  key={s.id}
                                  className="rounded bg-bg-tertiary px-2 py-1 font-mono text-xs text-text-tertiary"
                                >
                                  {s.weight === null
                                    ? `BW × ${s.reps}`
                                    : s.unit === 'lvl'
                                    ? `L${s.weight} × ${s.reps}`
                                    : `${s.weight}kg × ${s.reps}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
