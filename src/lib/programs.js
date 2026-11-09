import { supabase, isSupabaseConfigured } from './supabase.js'
import { saveActiveWorkout, getActiveWorkout } from './workoutStore.js'

const uid = () => Math.random().toString(36).slice(2, 9)
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// --- following (persisted per user) ---
export async function fetchFollowed(userId) {
  if (!isSupabaseConfigured || !userId) return { data: [], error: null }
  const { data, error } = await supabase
    .from('hugeaf_user_programs')
    .select('program_id, current_week, started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  return { data: data || [], error }
}

export async function followProgram(userId, programId) {
  if (!isSupabaseConfigured || !userId) return { error: new Error('Not signed in') }
  const { error } = await supabase
    .from('hugeaf_user_programs')
    .upsert({ user_id: userId, program_id: programId }, { onConflict: 'user_id,program_id' })
  return { error }
}

export async function unfollowProgram(userId, programId) {
  if (!isSupabaseConfigured || !userId) return { error: null }
  const { error } = await supabase
    .from('hugeaf_user_programs')
    .delete()
    .eq('user_id', userId)
    .eq('program_id', programId)
  return { error }
}

export async function setCurrentWeek(userId, programId, week) {
  if (!isSupabaseConfigured || !userId) return { error: null }
  const { error } = await supabase
    .from('hugeaf_user_programs')
    .update({ current_week: week })
    .eq('user_id', userId)
    .eq('program_id', programId)
  return { error }
}

// --- start a program day → active workout ---
// Returns true if it started; false if the user cancelled (had a workout going).
export function startProgramDay(program, day) {
  const active = getActiveWorkout()
  if (active && active.exercises.length > 0) {
    const ok = window.confirm('You have a workout in progress. Replace it with this session?')
    if (!ok) return false
  }
  const workout = {
    startedAt: Date.now(),
    title: day.name,
    subtitle: program.name,
    exercises: day.exercises.map((ex) => ({
      uid: uid(),
      exerciseId: slug(ex.name),
      name: ex.name,
      muscle: ex.muscle,
      target: `${ex.sets} × ${ex.reps}`,
      sets: Array.from({ length: ex.sets }, () => ({ id: uid(), prev: ex.reps, lb: '', reps: '', done: false })),
    })),
  }
  saveActiveWorkout(workout)
  return true
}
