// Shared workout-history math used by Home and Progress.
// Rows are hugeaf_workouts records: { finished_at, total_volume, total_sets, ... }

export function localDateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Consecutive-day training streak, allowed to start today or yesterday.
export function computeStreak(rows) {
  const days = new Set(rows.map((w) => localDateKey(new Date(w.finished_at))))
  let streak = 0
  const cursor = new Date()
  if (!days.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(localDateKey(cursor))) return 0
  }
  while (days.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function totalVolume(rows) {
  return rows.reduce((n, w) => n + (w.total_volume || 0), 0)
}

// Monday 00:00 of the current week.
export function startOfWeek(now = new Date()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const mondayOffset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - mondayOffset)
  return d
}

export function volumeThisWeek(rows) {
  const start = startOfWeek()
  return rows
    .filter((w) => new Date(w.finished_at) >= start)
    .reduce((n, w) => n + (w.total_volume || 0), 0)
}

export function formatK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `${n}`
}

export function totalSets(rows) {
  return rows.reduce((n, w) => n + (w.total_sets || 0), 0)
}

export function workoutsThisMonth(rows) {
  const now = new Date()
  return rows.filter((w) => {
    const d = new Date(w.finished_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}

// Average session length (seconds) across workouts that recorded a duration.
export function avgDuration(rows) {
  const withDur = rows.filter((w) => Number(w.duration_sec) > 0)
  if (!withDur.length) return 0
  return Math.round(withDur.reduce((n, w) => n + w.duration_sec, 0) / withDur.length)
}

export function totalDuration(rows) {
  return rows.reduce((n, w) => n + (Number(w.duration_sec) || 0), 0)
}

// "52m" or "1h 05m".
export function formatDuration(sec) {
  if (!sec || sec <= 0) return '–'
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}
