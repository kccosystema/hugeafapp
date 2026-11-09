import { supabase, isSupabaseConfigured } from './supabase.js'

// ---- Hybrid earning model ----
// Base for showing up + effort (sets & capped volume) + PR/streak bonuses.
export const SWEAT = {
  finish: 40,        // completing a workout
  perSet: 8,         // each completed set
  volumeDivisor: 150, // 1 Sweat per 150 lb of volume …
  volumeCap: 150,     // … capped so a monster session can't run away
  pr: 120,           // each exercise where you beat your previous best
  streak: 25,        // finishing while on a 2+ day streak
}

export function sweatForWorkout({ setsDone = 0, volume = 0 }, prCount = 0, hasStreak = false) {
  const finish = SWEAT.finish
  const sets = setsDone * SWEAT.perSet
  const vol = Math.min(SWEAT.volumeCap, Math.floor(volume / SWEAT.volumeDivisor))
  const pr = prCount * SWEAT.pr
  const streak = hasStreak ? SWEAT.streak : 0
  const breakdown = [
    { label: 'Workout complete', amount: finish },
    { label: `${setsDone} set${setsDone === 1 ? '' : 's'}`, amount: sets },
    { label: 'Volume', amount: vol },
  ]
  if (pr) breakdown.push({ label: `${prCount} new PR${prCount > 1 ? 's' : ''}`, amount: pr })
  if (streak) breakdown.push({ label: 'Streak bonus', amount: streak })
  return { total: finish + sets + vol + pr + streak, breakdown }
}

// ---- Growing-bucket levels ----
// Bucket size for level L = BASE * L (level 1 needs 500, level 2 needs 1000 …).
const BASE = 500
export function levelFromTotal(total) {
  let level = 1
  let remaining = Math.max(0, Math.floor(total || 0))
  let size = BASE * level
  while (remaining >= size) { remaining -= size; level += 1; size = BASE * level }
  return { level, into: remaining, bucketSize: size, pct: Math.min(100, Math.round((remaining / size) * 100)) }
}

// One-shot handoff so the SweatBar can play a "+N" splash the next time it
// mounts (e.g. landing on Home right after finishing a workout).
let pendingSplash = null
export function queueSweatSplash(amount) { pendingSplash = amount }
export function takeSweatSplash() { const v = pendingSplash; pendingSplash = null; return v }

// Add Sweat to the user's profile total; returns the new total.
export async function awardSweat(userId, amount) {
  if (!isSupabaseConfigured || !userId || !amount) return { total: null }
  const { data: prof } = await supabase.from('hugeaf_profiles').select('sweat').eq('id', userId).maybeSingle()
  const total = (prof?.sweat || 0) + amount
  await supabase.from('hugeaf_profiles').update({ sweat: total }).eq('id', userId)
  return { total }
}
