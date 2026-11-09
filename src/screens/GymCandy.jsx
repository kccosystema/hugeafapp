import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { fetchRatings, deleteRating, overallScore, computeStats } from '../lib/gymCandy.js'
import { useAuth } from '../lib/auth.jsx'
import './GymCandy.css'

function fmtDate(s) {
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function GymCandy() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ratings, setRatings] = useState([])
  const [loaded, setLoaded] = useState(false)

  function load() {
    fetchRatings(user?.id).then(({ data }) => { setRatings(data); setLoaded(true) })
  }
  useEffect(() => { load() }, [user?.id])

  const stats = useMemo(() => computeStats(ratings), [ratings])

  // Group ratings that share a title so duplicates collapse into one swipeable
  // card instead of repeating down the page. Groups keep newest-first order.
  const groups = useMemo(() => {
    const map = new Map()
    for (const r of ratings) {
      const key = (r.exercise_name || 'Session').trim().toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(r)
    }
    return [...map.values()]
  }, [ratings])

  async function remove(e, r) {
    e.stopPropagation()
    if (!window.confirm('Delete this rating?')) return
    await deleteRating(user?.id, r.id)
    setRatings((list) => list.filter((x) => x.id !== r.id))
  }

  const onEdit = (r) => navigate(`/gym-candy/${r.id}`, { state: { rating: r } })
  const onDupe = (r) => navigate('/gym-candy/new', { state: { rating: r } })

  const STAT_TILES = [
    { label: 'Ratings', value: stats.total },
    { label: 'Avg overall', value: stats.avgOverall, accent: true },
    { label: 'Avg form', value: stats.avgForm },
    { label: 'Avg effort', value: stats.avgEffort },
    { label: 'Best score', value: stats.best },
    { label: 'This week', value: stats.thisWeek },
  ]

  return (
    <div className="page gc fadeup">
      <StatusBar />
      <div className="gc-bar">
        <button className="gc-back" onClick={() => navigate('/')}>‹</button>
        <span className="gc-bar-title">Gym Candy</span>
        <span style={{ width: 34 }} />
      </div>

      <header className="gc-head">
        <h1 className="gc-title">Gym Candy</h1>
        <p className="gc-sub">Rate &amp; track your own sessions — form, effort, physique.</p>
      </header>

      <div className="px">
        <button className="gc-add" onClick={() => navigate('/gym-candy/new')}>＋ Add Rating</button>
      </div>

      {loaded && ratings.length > 0 && (
        <div className="gc-stats">
          {STAT_TILES.map((t) => (
            <div key={t.label} className="gc-stat">
              <div className={`gc-stat-num${t.accent ? ' accent' : ''}`}>{t.value}</div>
              <div className="gc-stat-label">{t.label}</div>
            </div>
          ))}
        </div>
      )}

      {loaded && ratings.length === 0 && (
        <div className="gc-empty">
          <div className="gc-empty-icon">🍬</div>
          <div className="gc-empty-title">No ratings yet</div>
          <div className="gc-empty-sub">Rate your form, effort and physique after a session — track it over time.</div>
        </div>
      )}

      <div className="gc-list">
        {groups.map((g) => (
          <RatingGroup key={g[0].id} group={g} onEdit={onEdit} onDupe={onDupe} onRemove={remove} />
        ))}
      </div>
    </div>
  )
}

// A single rating's card content.
function RatingCard({ r, onEdit, onDupe, onRemove }) {
  return (
    <button className="gc-card" onClick={() => onEdit(r)}>
      <div className="gc-card-top">
        <span className="gc-card-name">{r.exercise_name || 'Session'}</span>
        <span className="gc-card-score">{overallScore(r)}/100</span>
      </div>
      <div className="gc-card-meta">
        {r.gym && <span><span className="gc-pin">◎</span> {r.gym}</span>}
        <span>{fmtDate(r.rated_on)}</span>
      </div>
      {r.outfit && <div className="gc-card-outfit"><b>Outfit:</b> {r.outfit}</div>}
      <div className="gc-card-ratings">
        <span>🧍 {r.stance ?? '—'}</span>
        <span>🎯 {r.form ?? '—'}</span>
        <span>🔥 {r.effort ?? '—'}</span>
      </div>
      {r.notes && <div className="gc-card-notes">{r.notes}</div>}
      <div className="gc-card-actions">
        <span className="gc-act" onClick={(e) => { e.stopPropagation(); onEdit(r) }}>✎ Edit</span>
        <span className="gc-act" onClick={(e) => { e.stopPropagation(); onDupe(r) }}>⧉ Dupe</span>
        <span className="gc-act danger" onClick={(e) => onRemove(e, r)}>🗑 Delete</span>
      </div>
    </button>
  )
}

// One card for a group of same-title ratings; swipe horizontally when >1.
function RatingGroup({ group, onEdit, onDupe, onRemove }) {
  const [idx, setIdx] = useState(0)
  const ref = useRef(null)

  if (group.length === 1) {
    return <RatingCard r={group[0]} onEdit={onEdit} onDupe={onDupe} onRemove={onRemove} />
  }

  function onScroll() {
    const el = ref.current
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }
  function goTo(i) {
    const el = ref.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="gc-group">
      <div className="gc-swiper" ref={ref} onScroll={onScroll}>
        {group.map((r) => (
          <div className="gc-slide" key={r.id}>
            <RatingCard r={r} onEdit={onEdit} onDupe={onDupe} onRemove={onRemove} />
          </div>
        ))}
      </div>
      <div className="gc-dots">
        {group.map((r, i) => (
          <button
            key={r.id}
            className={'gc-dot' + (i === idx ? ' on' : '')}
            onClick={() => goTo(i)}
            aria-label={`Rating ${i + 1} of ${group.length}`}
          />
        ))}
        <span className="gc-dots-count">{idx + 1}/{group.length}</span>
      </div>
    </div>
  )
}
