// Form guides — DB-backed (hugeaf_form_guides). A guide is an infographic photo
// with a title + category. Falls back to the original bundled guide when
// Supabase isn't configured or the fetch is empty, so the section never blanks.
import { supabase, isSupabaseConfigured } from './supabase.js'

const BUNDLED = [
  { id: 'perfect-bench-press', title: 'The Perfect Bench Press', category: 'Chest', image: '/assets/guide-bench.png' },
]

function fromRow(r) {
  return { id: r.id, title: r.title, category: r.category, image: r.image_url }
}

let cache = null

export async function fetchGuides() {
  if (!isSupabaseConfigured) return BUNDLED
  const { data, error } = await supabase
    .from('hugeaf_form_guides')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error || !data || data.length === 0) return BUNDLED
  cache = data.map(fromRow)
  return cache
}

export async function fetchGuide(id) {
  if (cache) {
    const hit = cache.find((g) => g.id === id)
    if (hit) return hit
  }
  if (!isSupabaseConfigured) return BUNDLED.find((g) => g.id === id) || null
  const { data } = await supabase.from('hugeaf_form_guides').select('*').eq('id', id).maybeSingle()
  if (data) return fromRow(data)
  return BUNDLED.find((g) => g.id === id) || null
}
