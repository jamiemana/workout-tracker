interface StatCardProps {
  label: string
  value: string | number
  accent?: 'lime' | 'violet' | 'default'
}

export default function StatCard({ label, value, accent = 'default' }: StatCardProps) {
  const valueColor =
    accent === 'lime'
      ? 'text-accent-lime'
      : accent === 'violet'
      ? 'text-accent-violet'
      : 'text-text-primary'

  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
      <p className={`font-mono text-xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-text-tertiary">{label}</p>
    </div>
  )
}
