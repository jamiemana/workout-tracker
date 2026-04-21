import { useEffect, useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { db } from '@/lib/data/db'
import { getAllExercises } from '@/lib/data/templates'
import { estimateOneRepMax } from '@/lib/utils/volume'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import StatCard from '@/components/progress/StatCard'
import Header from '@/components/layout/Header'

interface ChartPoint {
  date: string
  maxWeight: number
  estimated1RM: number
}

type ChartMode = 'weight' | '1rm'

export default function Progress() {
  const exercises = useMemo(() => getAllExercises(), [])
  const [selectedExId, setSelectedExId] = useState(exercises[0]?.id ?? '')
  const unit = useSettingsStore(
    (s) => s.exerciseUnits[selectedExId] ?? 'kg'
  )
  const unitSuffix = unit === 'lvl' ? '' : 'kg'
  const unitPrefix = unit === 'lvl' ? 'L' : ''
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [mode, setMode] = useState<ChartMode>('weight')
  const [allTimePR, setAllTimePR] = useState<number>(0)
  const [currentBest, setCurrentBest] = useState<string>('')
  const [progressPct, setProgressPct] = useState<number>(0)

  useEffect(() => {
    if (!selectedExId) return
    loadExerciseData(selectedExId)
  }, [selectedExId])

  async function loadExerciseData(exerciseId: string) {
    const sets = await db.loggedSets
      .where('exerciseId')
      .equals(exerciseId)
      .filter((s) => s.completed && s.weight !== null && s.weight > 0)
      .toArray()

    // Get session dates
    const sessionIds = [...new Set(sets.map((s) => s.sessionId))]
    const sessions = await Promise.all(
      sessionIds.map((id) => db.workoutSessions.get(id))
    )

    const sessionDateMap = new Map<number, string>()
    for (const s of sessions) {
      if (s?.id) sessionDateMap.set(s.id, s.date)
    }

    // Group by session/date
    const byDate = new Map<string, { weight: number; reps: number }[]>()
    for (const s of sets) {
      const date = sessionDateMap.get(s.sessionId)
      if (!date) continue
      const existing = byDate.get(date) || []
      existing.push({ weight: s.weight!, reps: s.reps })
      byDate.set(date, existing)
    }

    const points: ChartPoint[] = []
    for (const [date, entries] of byDate) {
      const maxWeight = Math.max(...entries.map((e) => e.weight))
      const bestEntry = entries.reduce(
        (best, e) => (e.weight * e.reps > best.weight * best.reps ? e : best),
        entries[0]
      )
      const estimated1RM = estimateOneRepMax(bestEntry.weight, bestEntry.reps)
      points.push({ date, maxWeight, estimated1RM })
    }

    points.sort((a, b) => a.date.localeCompare(b.date))
    setChartData(points)

    // Stats
    if (points.length > 0) {
      const maxW = Math.max(...points.map((p) => p.maxWeight))
      setAllTimePR(maxW)

      const last = points[points.length - 1]
      const bestSet = sets
        .filter((s) => sessionDateMap.get(s.sessionId) === last.date)
        .reduce(
          (best, s) =>
            (s.weight ?? 0) * s.reps > (best.weight ?? 0) * best.reps ? s : best,
          sets[0]
        )
      setCurrentBest(
        `${unitPrefix}${bestSet.weight}${unitSuffix} × ${bestSet.reps}`
      )

      if (points.length >= 2) {
        const first = points[0].maxWeight
        const lastW = points[points.length - 1].maxWeight
        setProgressPct(
          first > 0 ? Math.round(((lastW - first) / first) * 100) : 0
        )
      } else {
        setProgressPct(0)
      }
    } else {
      setAllTimePR(0)
      setCurrentBest('-')
      setProgressPct(0)
    }
  }

  const selectedEx = exercises.find((e) => e.id === selectedExId)

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <Header />
      <div className="px-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
          Progression
        </p>
        <h1 className="mt-1 mb-4 text-[22px] font-semibold text-text-primary">
          Progress
        </h1>

        {/* Exercise selector */}
        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExId(ex.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedExId === ex.id
                    ? 'bg-accent-violet/15 text-accent-violet'
                    : 'bg-bg-input text-text-secondary'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode('weight')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === 'weight'
                ? 'bg-accent-violet/15 text-accent-violet'
                : 'bg-bg-input text-text-secondary'
            }`}
          >
            Max Weight
          </button>
          <button
            onClick={() => setMode('1rm')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === '1rm'
                ? 'bg-accent-violet/15 text-accent-violet'
                : 'bg-bg-input text-text-secondary'
            }`}
          >
            Est. 1RM
          </button>
        </div>

        {/* Chart */}
        <div className="mb-6 rounded-xl border border-border-default bg-bg-secondary p-4">
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-text-tertiary">
                No data yet for {selectedEx?.name ?? 'this exercise'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#666666' }}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T00:00:00')
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#666666' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111111',
                    border: '1px solid #2A2A2A',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#888888' }}
                />
                <Line
                  type="monotone"
                  dataKey={mode === 'weight' ? 'maxWeight' : 'estimated1RM'}
                  stroke="#8F00FF"
                  strokeWidth={2}
                  dot={{ fill: '#8F00FF', r: 4 }}
                  activeDot={{ r: 6, fill: '#8F00FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Current Best" value={currentBest} accent="lime" />
          <StatCard
            label="All-Time PR"
            value={`${unitPrefix}${allTimePR}${unitSuffix}`}
            accent="violet"
          />
          <StatCard
            label="Progress"
            value={`${progressPct >= 0 ? '+' : ''}${progressPct}%`}
          />
        </div>
      </div>
    </div>
  )
}
