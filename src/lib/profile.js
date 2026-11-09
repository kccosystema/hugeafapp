import { supabase, isSupabaseConfigured } from './supabase.js'

// Fetch the signed-in user's profile row (or null if they haven't onboarded).
export async function fetchProfile(userId) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: null }
  const { data, error } = await supabase
    .from('hugeaf_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return { data: data || null, error }
}

// Create or update the profile. Marks onboarded=true on completion.
export async function saveProfile(userId, fields) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: new Error('Not signed in') }
  const row = { id: userId, ...fields, updated_at: new Date().toISOString() }
  const { data, error } = await supabase
    .from('hugeaf_profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle()
  return { data: data || null, error }
}

// Unit conversion helpers (canonical storage = cm + kg).
export const toCm = (ft, inch) => Math.round(((Number(ft) || 0) * 12 + (Number(inch) || 0)) * 2.54)
export const fromCm = (cm) => {
  const totalIn = Math.round((Number(cm) || 0) / 2.54)
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 }
}
export const lbToKg = (lb) => Math.round((Number(lb) || 0) / 2.2046226 * 10) / 10
export const kgToLb = (kg) => Math.round((Number(kg) || 0) * 2.2046226)
