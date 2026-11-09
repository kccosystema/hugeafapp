// One-time bulk loader: pushes the bundled exercises.json into the
// public.hugeaf_exercises table (as global rows, user_id = null) via the REST API.
// Requires the TEMPORARY "temp seed global" insert policy to be in place.
//
// Usage: node scripts/load-exercises.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
const URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim()
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim()

const all = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'exercises.json'), 'utf8'))
const endpoint = `${URL}/rest/v1/hugeaf_exercises`
const BATCH = 500

let inserted = 0
for (let i = 0; i < all.length; i += BATCH) {
  const batch = all.slice(i, i + BATCH).map((e) => ({
    id: e.id, name: e.name, muscle: e.muscle, equipment: e.equipment,
    difficulty: e.difficulty, region: e.region, mechanics: e.mechanics,
    video: e.video ?? null, user_id: null,
  }))
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(batch),
  })
  if (!res.ok) {
    console.error(`Batch ${i}-${i + batch.length} FAILED (${res.status}):`, await res.text())
    process.exit(1)
  }
  inserted += batch.length
  process.stdout.write(`\rinserted ${inserted}/${all.length}`)
}
console.log(`\n✓ done — ${inserted} exercises loaded`)
