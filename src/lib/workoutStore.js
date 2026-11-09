// Single source of truth for the in-progress workout, persisted to localStorage
// so logging survives a refresh, backgrounding, or the PWA being killed.

export const STORAGE_KEY = 'hugeaf:activeWorkout'

// Returns the active workout only if it has real content (≥1 exercise),
// so a stale empty shell never blocks starting fresh or shows a bogus timer.
export function getActiveWorkout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const w = raw ? JSON.parse(raw) : null
    return w && Array.isArray(w.exercises) && w.exercises.length > 0 ? w : null
  } catch {
    return null
  }
}

export function saveActiveWorkout(workout) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workout)) } catch { /* quota */ }
}

export function clearActiveWorkout() {
  localStorage.removeItem(STORAGE_KEY)
}

const uid = () => Math.random().toString(36).slice(2, 9)

// Append an exercise to the active workout (creating a fresh one if none),
// then return it. Used by the "Add to workout" button on exercise detail.
export function addExerciseToActiveWorkout(ex) {
  let w
  try { w = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { w = null }
  if (!w || !Array.isArray(w.exercises)) {
    w = { startedAt: Date.now(), title: 'New workout', subtitle: '', exercises: [] }
  }
  w.exercises.push({
    uid: uid(),
    exerciseId: ex.id,
    name: ex.name,
    muscle: ex.muscle,
    sets: [{ id: uid(), prev: '', lb: '', reps: '', done: false }],
  })
  saveActiveWorkout(w)
  return w
}
