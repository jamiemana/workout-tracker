/**
 * Calendar date (YYYY-MM-DD) in the device's own time zone. Workouts are
 * dated by the day they happened where the lifter is, not by the UTC day.
 */
export function localISODate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
