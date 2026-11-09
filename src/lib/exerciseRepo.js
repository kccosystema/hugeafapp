// Exercise source of truth = Supabase `hugeaf_exercises` (global rows + the
// signed-in user's custom rows). We fetch once, cache in localStorage + memory,
// and fall back to the bundled JSON so the picker is instant and works offline.
import { supabase, isSupabaseConfigured } from './supabase.js'
import bundled from '../data/exercises.json'

const LS_KEY = 'hugeaf:exercises:v1'
let memo = null

export function bundledExercises() {
  return bundled
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    return c && Array.isArray(c.list) && c.list.length ? c.list : null
  } catch {
    return null
  }
}

function writeCache(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), list })) } catch { /* quota */ }
}

// Supabase caps a response at 1000 rows, so page through with .range().
async function fetchAll() {
  if (!isSupabaseConfigured) return null
  try {
    const PAGE = 1000
    let from = 0
    let out = []
    for (;;) {
      const { data, error } = await supabase
        .from('hugeaf_exercises')
        .select('id,name,muscle,equipment,difficulty,region,mechanics,video,user_id')
        .order('name')
        .range(from, from + PAGE - 1)
      if (error) throw error
      out = out.concat(data || [])
      if (!data || data.length < PAGE) break
      from += PAGE
    }
    return out
  } catch (e) {
    console.warn('[exercises] fetch failed, using cache/bundle:', e.message)
    return null
  }
}

// Returns a list SYNCHRONOUSLY (cache or bundled) for instant UX, then calls
// onUpdate(freshList) once the database copy arrives/refreshes.
export function loadExercises(_userId, onUpdate) {
  if (memo) {
    fetchAll().then((fresh) => { if (fresh) { memo = fresh; writeCache(fresh); onUpdate?.(fresh) } })
    return memo
  }
  const cached = readCache()
  memo = cached || bundled
  fetchAll().then((fresh) => { if (fresh) { memo = fresh; writeCache(fresh); onUpdate?.(fresh) } })
  return memo
}

// Look up a single exercise by id — checks the in-memory/cached list first,
// then falls back to a direct DB query (e.g. when a detail URL is opened cold).
export async function getExerciseById(id) {
  const local = (memo || readCache() || bundled).find((e) => e.id === id)
  if (local) return local
  if (isSupabaseConfigured) {
    const { data } = await supabase.from('hugeaf_exercises').select('*').eq('id', id).maybeSingle()
    return data || null
  }
  return null
}

// Insert a user's custom exercise; updates caches and returns the new row.
export async function addCustomExercise(userId, { name, muscle, equipment }) {
  const row = {
    id: `custom-${Math.random().toString(36).slice(2, 10)}`,
    name: name.trim(),
    muscle: muscle || 'Custom',
    equipment: (equipment || '').trim(),
    difficulty: '', region: '', mechanics: '', video: null,
    user_id: userId,
  }
  if (isSupabaseConfigured && userId) {
    const { error } = await supabase.from('hugeaf_exercises').insert(row)
    if (error) return { error }
  }
  memo = [...(memo || bundled), row].sort((a, b) => a.name.localeCompare(b.name))
  writeCache(memo)
  return { data: row, error: null }
}
