// 10×3 strength program — auto-regulating progression.
// Rule: weight only goes up after a fully completed 10×3. If you complete fewer
// than 10 clean sets, the weight stays and you chase the missed sets next time.
import { supabase, isSupabaseConfigured } from './supabase.js'
import { saveActiveWorkout, getActiveWorkout } from './workoutStore.js'

const uid = () => Math.random().toString(36).slice(2, 9)
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const PRESS_OPTIONS = [
  'Flat Barbell Bench Press',
  'Incline Barbell Press',
  'Incline Dumbbell Press',
  'Flat Dumbbell Press',
  'Weighted Dips',
]
export const SETS = 10
export const REPS = 3

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function fetchState(userId) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: null }
  const { data, error } = await supabase
    .from('hugeaf_program_1030')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return { data: data || null, error }
}

export async function startState(userId, { exercise, unit, weight, increment }) {
  if (!isSupabaseConfigured || !userId) return { error: new Error('Not signed in') }
  const row = {
    user_id: userId,
    exercise,
    unit: unit || 'lb',
    weight: Number(weight) || 0,
    increment: Number(increment) || (unit === 'kg' ? 2.5 : 5),
    week: 1,
    sessions: [],
  }
  const { data, error } = await supabase
    .from('hugeaf_program_1030')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .maybeSingle()
  return { data, error }
}

export async function updateConfig(userId, patch) {
  const { data, error } = await supabase
    .from('hugeaf_program_1030')
    .update(patch)
    .eq('user_id', userId)
    .select()
    .maybeSingle()
  return { data, error }
}

export async function resetState(userId) {
  const { error } = await supabase.from('hugeaf_program_1030').delete().eq('user_id', userId)
  return { error }
}

// Pure: given current state + clean sets completed this session, produce the log
// entry and the next state. Weight only advances on a full 10.
export function computeNext(state, setsCompleted) {
  const completed = Math.max(0, Math.min(SETS, Number(setsCompleted) || 0))
  const completedAll = completed >= SETS
  const entry = {
    date: todayStr(),
    week: state.week,
    weight: Number(state.weight),
    sets_completed: completed,
    completed_all: completedAll,
  }
  const nextWeight = completedAll ? Number(state.weight) + Number(state.increment) : Number(state.weight)
  return { entry, completedAll, nextWeight, nextWeek: state.week + 1 }
}

export async function logSession(userId, state, setsCompleted) {
  const { entry, completedAll, nextWeight, nextWeek } = computeNext(state, setsCompleted)
  const sessions = [...(state.sessions || []), entry]
  const { data, error } = await supabase
    .from('hugeaf_program_1030')
    .update({ weight: nextWeight, week: nextWeek, sessions })
    .eq('user_id', userId)
    .select()
    .maybeSingle()
  return { data, error, completedAll, nextWeight, entry }
}

// Prefill the standard workout logger with 10 sets × 3 at the current weight.
export function startTenSession(state) {
  const active = getActiveWorkout()
  if (active && active.exercises.length > 0) {
    const ok = window.confirm('You have a workout in progress. Replace it with this 10×3 session?')
    if (!ok) return false
  }
  const muscle = state.exercise?.includes('Dips') ? 'Triceps' : 'Chest'
  const workout = {
    startedAt: Date.now(),
    title: '10×3 Strength',
    subtitle: state.exercise,
    exercises: [{
      uid: uid(),
      exerciseId: slugify(state.exercise),
      name: state.exercise,
      muscle,
      target: `${SETS} × ${REPS}`,
      sets: Array.from({ length: SETS }, () => ({
        id: uid(), prev: String(REPS), lb: String(state.weight || ''), reps: '', done: false,
      })),
    }],
  }
  saveActiveWorkout(workout)
  return true
}
