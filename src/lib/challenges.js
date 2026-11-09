import { supabase, isSupabaseConfigured } from './supabase.js'
import { challenges as bundled } from '../data/challenges.js'

// Challenge CATALOG is now DB-backed (hugeaf_challenges). Maps DB rows to the
// shape the screens expect; falls back to the bundled list when Supabase isn't
// configured or the fetch is empty/errors, so the app never shows nothing.
function fromRow(r) {
  return {
    id: r.slug,
    title: r.title,
    image: r.image_url,
    tag: r.tag,
    type: r.type,
    goal: r.goal,
    unit: r.unit,
    durationDays: r.duration_days,
    participants: r.participants ?? 0,
    summary: r.summary,
  }
}

let catalogCache = null

export async function fetchChallenges() {
  if (!isSupabaseConfigured) return bundled
  const { data, error } = await supabase
    .from('hugeaf_challenges')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error || !data || data.length === 0) return bundled
  catalogCache = data.map(fromRow)
  return catalogCache
}

// Sync lookup from whatever catalog we last loaded, then the bundle.
export function getChallengeCached(id) {
  const list = catalogCache || bundled
  return list.find((c) => c.id === id) || bundled.find((c) => c.id === id) || null
}

export async function fetchJoined(userId) {
  if (!isSupabaseConfigured || !userId) return { data: [], error: null }
  const { data, error } = await supabase
    .from('hugeaf_user_challenges')
    .select('challenge_id, progress, last_checkin, completed, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
  return { data: data || [], error }
}

export async function joinChallenge(userId, challengeId) {
  if (!isSupabaseConfigured || !userId) return { error: new Error('Not signed in') }
  const { data, error } = await supabase
    .from('hugeaf_user_challenges')
    .upsert({ user_id: userId, challenge_id: challengeId }, { onConflict: 'user_id,challenge_id' })
    .select()
    .maybeSingle()
  return { data, error }
}

export async function leaveChallenge(userId, challengeId) {
  if (!isSupabaseConfigured || !userId) return { error: null }
  const { error } = await supabase
    .from('hugeaf_user_challenges')
    .delete()
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
  return { error }
}

export async function updateProgress(userId, challengeId, patch) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: null }
  const { data, error } = await supabase
    .from('hugeaf_user_challenges')
    .update(patch)
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .select()
    .maybeSingle()
  return { data, error }
}

// Progress toward a challenge's goal. `workouts` type derives from history;
// everything else reads the stored progress row.
export function computeProgress(challenge, row, history = []) {
  let value
  if (challenge.type === 'workouts') {
    const since = row?.joined_at ? new Date(row.joined_at) : null
    value = since ? history.filter((w) => new Date(w.finished_at) >= since).length : 0
  } else {
    value = row?.completed ? challenge.goal : Number(row?.progress) || 0
  }
  const pct = Math.min(100, Math.round((value / challenge.goal) * 100))
  return { value, goal: challenge.goal, pct, done: value >= challenge.goal }
}

export function daysLeft(challenge, row) {
  if (!row?.joined_at) return challenge.durationDays
  const elapsed = Math.floor((Date.now() - new Date(row.joined_at)) / 86400000)
  return Math.max(0, challenge.durationDays - elapsed)
}

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
