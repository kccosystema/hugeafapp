// Suggest exercises that "go with" the workout in progress. Pure heuristic —
// no backend, instant, offline. Uses the muscle each logged exercise trains to
// recommend complementary movements from the same training day (push/pull/legs/
// core), compound-first, excluding anything already added.

// Muscle → training group.
const GROUP = {
  Chest: 'push', Shoulders: 'push', Triceps: 'push',
  Back: 'pull', Trapezius: 'pull', Biceps: 'pull', Forearms: 'pull',
  Quadriceps: 'legs', Hamstrings: 'legs', Glutes: 'legs', Calves: 'legs',
  'Hip Flexors': 'legs', Adductors: 'legs', Abductors: 'legs', Shins: 'legs',
  Abdominals: 'core',
}

// The muscles we actively suggest for each group (keeps it to the main movers).
const GROUP_MEMBERS = {
  push: ['Chest', 'Shoulders', 'Triceps'],
  pull: ['Back', 'Trapezius', 'Biceps', 'Forearms'],
  legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
  core: ['Abdominals'],
}

// Major muscle groups the user picks from, and the fine-muscle → major map.
export const MAJOR_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core']
const TO_MAJOR = {
  Chest: 'Chest',
  Back: 'Back', Trapezius: 'Back',
  Shoulders: 'Shoulders',
  Biceps: 'Arms', Triceps: 'Arms', Forearms: 'Arms',
  Quadriceps: 'Legs', Hamstrings: 'Legs', Glutes: 'Legs', Calves: 'Legs',
  'Hip Flexors': 'Legs', Adductors: 'Legs', Abductors: 'Legs', Shins: 'Legs',
  Abdominals: 'Core',
}
export function majorGroup(muscle) {
  return TO_MAJOR[muscle] || null
}

// Resolve a fine muscle for an {name, exerciseId, muscle?} object using the DB.
export function resolveMuscle(e, all) {
  if (e?.muscle) return e.muscle
  if (!Array.isArray(all) || !all.length) return null
  const norm = (s) => (s || '').trim().toLowerCase()
  const key = norm(e?.name)
  for (const x of all) {
    if (e?.exerciseId && x.id === e.exerciseId && x.muscle) return x.muscle
    if (norm(x.name) === key && x.muscle) return x.muscle
  }
  const terms = key.split(/\s+/).filter(Boolean)
  if (!terms.length) return null
  let best = null
  for (const x of all) {
    const h = norm(x.name)
    if (terms.every((t) => h.includes(t)) && (!best || x.name.length < best.name.length)) best = x
  }
  return best?.muscle || null
}

// Curated "greatest hits" per major group — shown when the user has no logged
// history for that group yet. Clean, recognizable names + correct muscle.
const POPULAR_BY_GROUP = {
  Chest: [
    { name: 'Barbell Bench Press', muscle: 'Chest' },
    { name: 'Incline Dumbbell Press', muscle: 'Chest' },
    { name: 'Dumbbell Bench Press', muscle: 'Chest' },
    { name: 'Cable Fly', muscle: 'Chest' },
    { name: 'Chest Dip', muscle: 'Chest' },
    { name: 'Push-Up', muscle: 'Chest' },
  ],
  Back: [
    { name: 'Deadlift', muscle: 'Back' },
    { name: 'Pull-Up', muscle: 'Back' },
    { name: 'Barbell Row', muscle: 'Back' },
    { name: 'Lat Pulldown', muscle: 'Back' },
    { name: 'Seated Cable Row', muscle: 'Back' },
    { name: 'One-Arm Dumbbell Row', muscle: 'Back' },
  ],
  Shoulders: [
    { name: 'Overhead Press', muscle: 'Shoulders' },
    { name: 'Dumbbell Shoulder Press', muscle: 'Shoulders' },
    { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders' },
    { name: 'Face Pull', muscle: 'Shoulders' },
    { name: 'Rear Delt Fly', muscle: 'Shoulders' },
    { name: 'Arnold Press', muscle: 'Shoulders' },
  ],
  Arms: [
    { name: 'Barbell Curl', muscle: 'Biceps' },
    { name: 'Hammer Curl', muscle: 'Biceps' },
    { name: 'Dumbbell Curl', muscle: 'Biceps' },
    { name: 'Triceps Rope Pushdown', muscle: 'Triceps' },
    { name: 'Skull Crusher', muscle: 'Triceps' },
    { name: 'Overhead Triceps Extension', muscle: 'Triceps' },
  ],
  Legs: [
    { name: 'Barbell Back Squat', muscle: 'Quadriceps' },
    { name: 'Romanian Deadlift', muscle: 'Hamstrings' },
    { name: 'Leg Press', muscle: 'Quadriceps' },
    { name: 'Leg Extension', muscle: 'Quadriceps' },
    { name: 'Lying Leg Curl', muscle: 'Hamstrings' },
    { name: 'Standing Calf Raise', muscle: 'Calves' },
  ],
  Core: [
    { name: 'Plank', muscle: 'Abdominals' },
    { name: 'Hanging Leg Raise', muscle: 'Abdominals' },
    { name: 'Cable Crunch', muscle: 'Abdominals' },
    { name: 'Russian Twist', muscle: 'Abdominals' },
    { name: 'Ab Wheel Rollout', muscle: 'Abdominals' },
    { name: 'Bicycle Crunch', muscle: 'Abdominals' },
  ],
}

// A few recommended popular exercises for a group (curated), excluding anything
// already in the session. Works without the DB loaded.
export function recommendedForGroup(group, excludeNames = new Set(), max = 8) {
  const norm = (s) => (s || '').trim().toLowerCase()
  return (POPULAR_BY_GROUP[group] || [])
    .filter((e) => !excludeNames.has(norm(e.name)))
    .slice(0, max)
}

// Top DB exercises for a major group (compound/free-weight first), excluding
// names already added. Used as a fallback when the user has no history.
export function popularForGroup(all, group, excludeNames = new Set(), max = 10) {
  if (!Array.isArray(all)) return []
  const norm = (s) => (s || '').trim().toLowerCase()
  return all
    .filter((e) => e.name && majorGroup(e.muscle) === group && !excludeNames.has(norm(e.name)))
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, max)
}

function hasYouTube(url) {
  return !!(url && /(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/.test(url))
}

// A varied set of exercises that have a demo video — round-robin across muscle
// groups, compound/free-weight first — for the Home "Exercise videos" row.
export function videoPicks(all, max = 12) {
  if (!Array.isArray(all)) return []
  const byGroup = {}
  for (const e of all) {
    if (!hasYouTube(e.video)) continue
    const g = majorGroup(e.muscle) || 'Other'
    ;(byGroup[g] = byGroup[g] || []).push(e)
  }
  for (const g of Object.keys(byGroup)) byGroup[g].sort((a, b) => rank(b) - rank(a))
  const groups = Object.keys(byGroup)
  const out = []
  for (let i = 0; out.length < max; i++) {
    let progressed = false
    for (const g of groups) {
      const e = byGroup[g][i]
      if (e) { out.push(e); progressed = true; if (out.length >= max) break }
    }
    if (!progressed) break
  }
  return out
}

// Prefer compound / free-weight movements first.
function rank(e) {
  let r = 0
  const mech = (e.mechanics || '').toLowerCase()
  const eq = (e.equipment || '').toLowerCase()
  if (mech.includes('compound')) r += 3
  if (eq.includes('barbell')) r += 2
  else if (eq.includes('dumbbell')) r += 1.5
  else if (eq.includes('cable') || eq.includes('machine')) r += 1
  return r
}

export function suggestExercises(workout, all, max = 8) {
  const exs = workout?.exercises || []
  if (!exs.length || !Array.isArray(all) || !all.length) return []

  // Some exercises (template/program-started, or older saved workouts) don't
  // carry a `muscle`. Resolve it from the DB by id, then exact name, then a
  // fuzzy name match, so the suggester still knows what training day this is.
  const norm = (s) => (s || '').trim().toLowerCase()
  const byId = new Map()
  const byName = new Map()
  for (const e of all) {
    byId.set(e.id, e)
    byName.set(norm(e.name), e)
  }
  const muscleOf = (e) => {
    if (e.muscle) return e.muscle
    if (byId.get(e.exerciseId)?.muscle) return byId.get(e.exerciseId).muscle
    const key = norm(e.name)
    if (byName.get(key)?.muscle) return byName.get(key).muscle
    const terms = key.split(/\s+/).filter(Boolean)
    if (!terms.length) return null
    // tightest DB name that contains every word of the logged exercise
    let best = null
    for (const x of all) {
      const h = norm(x.name)
      if (terms.every((t) => h.includes(t)) && (!best || x.name.length < best.name.length)) best = x
    }
    return best?.muscle || null
  }

  const addedIds = new Set(exs.map((e) => e.exerciseId))
  const addedNames = new Set(exs.map((e) => (e.name || '').trim().toLowerCase()))
  const addedMuscles = exs.map(muscleOf).filter(Boolean)

  // How many of each muscle are already in the session.
  const present = {}
  addedMuscles.forEach((m) => { present[m] = (present[m] || 0) + 1 })

  // Score candidate muscles: complements not yet trained rank highest, muscles
  // already present still score (more volume) but lower.
  const activeGroups = new Set(addedMuscles.map((m) => GROUP[m]).filter(Boolean))
  const score = {}
  activeGroups.forEach((g) => {
    (GROUP_MEMBERS[g] || []).forEach((m) => {
      score[m] = (score[m] || 0) + (present[m] ? 1 : 3)
    })
  })
  const muscles = Object.keys(score).sort((a, b) => score[b] - score[a])
  if (!muscles.length) return []

  // Candidate exercises per muscle, best-first.
  const pool = {}
  for (const m of muscles) {
    pool[m] = all
      .filter((e) => e.muscle === m && e.name
        && !addedIds.has(e.id) && !addedNames.has((e.name || '').trim().toLowerCase()))
      .sort((a, b) => rank(b) - rank(a))
  }

  // Round-robin across muscles (score order) so the strip is varied.
  const out = []
  for (let round = 0; out.length < max; round++) {
    let progressed = false
    for (const m of muscles) {
      const pick = pool[m]?.[round]
      if (pick) { out.push(pick); progressed = true; if (out.length >= max) break }
    }
    if (!progressed) break
  }
  return out
}
