// Blog data — now DB-backed (hugeaf_blog_posts). Falls back to the bundled
// articles when Supabase isn't configured or a fetch fails, so the app never
// shows an empty blog. Maps DB rows to the shape the screens already expect.
import { supabase, isSupabaseConfigured } from './supabase.js'
import { articles as bundled, categories } from '../data/blog.js'

export { categories }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function fromRow(r) {
  return {
    id: r.slug,
    title: r.title,
    category: r.category,
    excerpt: r.excerpt,
    image: r.image_url,
    author: r.author,
    authorInitials: r.author_initials,
    date: fmtDate(r.published_at || r.created_at),
    readMin: r.read_min,
    featured: r.featured,
    body: Array.isArray(r.body) ? r.body : [],
  }
}

let cache = null

export async function fetchArticles() {
  if (!isSupabaseConfigured) return bundled
  const { data, error } = await supabase
    .from('hugeaf_blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
  if (error || !data || data.length === 0) return bundled
  cache = data.map(fromRow)
  return cache
}

export async function fetchArticle(slug) {
  if (cache) {
    const hit = cache.find((a) => a.id === slug)
    if (hit) return hit
  }
  if (!isSupabaseConfigured) return bundled.find((a) => a.id === slug) || null
  const { data } = await supabase
    .from('hugeaf_blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (data) return fromRow(data)
  return bundled.find((a) => a.id === slug) || null
}
