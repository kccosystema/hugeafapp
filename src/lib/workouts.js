import { supabase, isSupabaseConfigured } from './supabase.js'

// Persist a finished workout to the cloud. Returns { error } so callers can
// surface failures without blocking the celebration screen.
export async function saveFinishedWorkout(workout, totals, durationSec, userId) {
  if (!isSupabaseConfigured || !userId) return { error: null, skipped: true }

  const { error } = await supabase.from('hugeaf_workouts').insert({
    user_id: userId,
    title: workout.title || 'Workout',
    subtitle: workout.subtitle || '',
    started_at: new Date(workout.startedAt).toISOString(),
    finished_at: new Date().toISOString(),
    duration_sec: durationSec,
    total_volume: totals.volume,
    total_sets: totals.setsDone,
    exercises: workout.exercises,
  })
  return { error }
}

// Map of exercise name (lowercased) → the most recent session's logged sets,
// so the tracker can show "previous" numbers to beat. Only counts completed
// sets that had a weight/reps entered.
export async function fetchExerciseHistory(userId, limit = 80) {
  if (!isSupabaseConfigured || !userId) return {}
  const { data, error } = await supabase
    .from('hugeaf_workouts')
    .select('exercises, finished_at')
    .eq('user_id', userId)
    .order('finished_at', { ascending: false })
    .limit(limit)
  if (error || !data) return {}

  const map = {}
  for (const w of data) {
    const exs = Array.isArray(w.exercises) ? w.exercises : []
    for (const ex of exs) {
      const key = (ex.name || '').trim().toLowerCase()
      if (!key || map[key]) continue // first (most recent) occurrence wins
      const done = (ex.sets || []).filter((s) => s.done && (Number(s.lb) || Number(s.reps)))
      if (!done.length) continue
      const sets = done.map((s) => ({ lb: Number(s.lb) || 0, reps: Number(s.reps) || 0 }))
      const best = sets.reduce((a, b) => (b.lb > a.lb ? b : a), sets[0])
      map[key] = { sets, best: `${best.lb} × ${best.reps}`, date: w.finished_at }
    }
  }
  return map
}

// How often the user has logged each exercise, across recent history.
// Returns [{ name, exerciseId, muscle, count }] sorted most-used first.
export async function fetchExerciseCounts(userId, lookback = 120) {
  if (!isSupabaseConfigured || !userId) return []
  const { data, error } = await supabase
    .from('hugeaf_workouts')
    .select('exercises')
    .eq('user_id', userId)
    .order('finished_at', { ascending: false })
    .limit(lookback)
  if (error || !data) return []

  const counts = new Map()
  for (const w of data) {
    const exs = Array.isArray(w.exercises) ? w.exercises : []
    for (const ex of exs) {
      const name = (ex.name || '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      const cur = counts.get(key) || { name, exerciseId: ex.exerciseId || null, muscle: ex.muscle || null, count: 0 }
      cur.count += 1
      if (!cur.muscle && ex.muscle) cur.muscle = ex.muscle
      if (!cur.exerciseId && ex.exerciseId) cur.exerciseId = ex.exerciseId
      counts.set(key, cur)
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)
}

// Top exercises the user has logged on the CURRENT day of the week (e.g. all
// past Mondays), for the Home "On this day" section.
export async function fetchWeekdayTopExercises(userId, max = 3) {
  if (!isSupabaseConfigured || !userId) return []
  const { data, error } = await supabase
    .from('hugeaf_workouts')
    .select('exercises, finished_at')
    .eq('user_id', userId)
    .order('finished_at', { ascending: false })
    .limit(250)
  if (error || !data) return []

  const dow = new Date().getDay()
  const counts = new Map()
  for (const w of data) {
    if (new Date(w.finished_at).getDay() !== dow) continue
    const exs = Array.isArray(w.exercises) ? w.exercises : []
    for (const ex of exs) {
      const name = (ex.name || '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      const cur = counts.get(key) || { name, exerciseId: ex.exerciseId || null, muscle: ex.muscle || null, count: 0 }
      cur.count += 1
      counts.set(key, cur)
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, max)
}

// Recent finished workouts for the signed-in user (newest first).
export async function fetchWorkoutHistory(userId, limit = 50) {
  if (!isSupabaseConfigured || !userId) return { data: [], error: null }
  const { data, error } = await supabase
    .from('hugeaf_workouts')
    .select('id, title, subtitle, finished_at, duration_sec, total_volume, total_sets')
    .eq('user_id', userId)
    .order('finished_at', { ascending: false })
    .limit(limit)
  return { data: data || [], error }
}
