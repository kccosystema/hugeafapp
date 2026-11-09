import { supabase, isSupabaseConfigured } from './supabase.js'

const COLS = 'id, rated_on, gym, exercise_name, outfit, stance, form, effort, arms, chest, back, glutes, legs, height_cm, weight_kg, notes, created_at'

export async function fetchRatings(userId) {
  if (!isSupabaseConfigured || !userId) return { data: [], error: null }
  const { data, error } = await supabase
    .from('hugeaf_gym_candy')
    .select(COLS)
    .eq('user_id', userId)
    .order('rated_on', { ascending: false })
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

// Insert (no id) or update (with id). `fields` should already be normalized.
export async function saveRating(userId, fields, id) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: new Error('Not signed in') }
  if (id) {
    const { data, error } = await supabase
      .from('hugeaf_gym_candy').update(fields).eq('id', id).eq('user_id', userId).select().maybeSingle()
    return { data, error }
  }
  const { data, error } = await supabase
    .from('hugeaf_gym_candy').insert({ ...fields, user_id: userId }).select().maybeSingle()
  return { data, error }
}

export async function deleteRating(userId, id) {
  if (!isSupabaseConfigured || !userId) return { error: null }
  const { error } = await supabase.from('hugeaf_gym_candy').delete().eq('id', id).eq('user_id', userId)
  return { error }
}

// Headline score = average of the three main ratings.
export function overallScore(r) {
  const parts = [r.stance, r.form, r.effort].map((v) => Number(v) || 0)
  return Math.round(parts.reduce((a, b) => a + b, 0) / 3)
}

export function computeStats(ratings) {
  const n = ratings.length
  if (!n) return { total: 0, avgOverall: 0, avgForm: 0, avgEffort: 0, best: 0, thisWeek: 0 }
  const avg = (key) => Math.round(ratings.reduce((s, r) => s + (Number(r[key]) || 0), 0) / n)
  const overalls = ratings.map(overallScore)
  const weekAgo = Date.now() - 7 * 86400000
  return {
    total: n,
    avgOverall: Math.round(overalls.reduce((a, b) => a + b, 0) / n),
    avgForm: avg('form'),
    avgEffort: avg('effort'),
    best: Math.max(...overalls),
    thisWeek: ratings.filter((r) => new Date(r.rated_on).getTime() >= weekAgo).length,
  }
}
