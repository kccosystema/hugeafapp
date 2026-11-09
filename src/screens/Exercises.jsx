import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import SweatBar from '../components/SweatBar.jsx'
import { loadExercises, bundledExercises } from '../lib/exerciseRepo.js'
import { searchExercises, muscleOrder, muscleMeta } from '../data/exercises.js'
import MuscleIcon from '../components/MuscleIcon.jsx'
import { useAuth } from '../lib/auth.jsx'
import './Exercises.css'

export default function Exercises() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState(bundledExercises)
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('All')
  const [limit, setLimit] = useState(40)

  useEffect(() => {
    setList(loadExercises(user?.id, (fresh) => setList(fresh)))
  }, [user?.id])

  // muscle-group chips with counts, in canonical order
  const muscles = useMemo(() => {
    const counts = new Map()
    list.forEach((e) => counts.set(e.muscle, (counts.get(e.muscle) || 0) + 1))
    const ordered = muscleOrder.filter((m) => counts.has(m)).map((m) => [m, counts.get(m)])
    const extra = [...counts.keys()].filter((m) => !muscleOrder.includes(m)).map((m) => [m, counts.get(m)])
    return ordered.concat(extra)
  }, [list])

  const filtered = useMemo(() => {
    const base = muscle === 'All' ? list : list.filter((e) => e.muscle === muscle)
    return searchExercises(base, query)
  }, [list, muscle, query])

  // reset the visible count when the filter/search changes
  useEffect(() => { setLimit(40) }, [query, muscle])

  const shown = filtered.slice(0, limit)
  const remaining = filtered.length - shown.length

  return (
    <div className="page exercises fadeup">
      <StatusBar />
      <SweatBar />
      <header className="ex-head">
        <h1 className="ex-title">Exercises</h1>
        <p className="ex-sub">{list.length.toLocaleString()} in the library</p>
      </header>

      <div className="ex-search">
        <span className="ex-search-icon">⌕</span>
        <input
          className="ex-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises, equipment…"
        />
        {query && <button className="ex-search-clear" onClick={() => setQuery('')}>✕</button>}
      </div>

      <div className="ex-chips scrl">
        <button className={`ex-chip${muscle === 'All' ? ' on' : ''}`} onClick={() => setMuscle('All')}>
          All <span>{list.length}</span>
        </button>
        {muscles.map(([m, c]) => (
          <button key={m} className={`ex-chip${muscle === m ? ' on' : ''}`} onClick={() => setMuscle(m)}>
            {m} <span>{c}</span>
          </button>
        ))}
      </div>

      <div className="ex-list">
        {filtered.length === 0 && <div className="ex-empty">No exercises match “{query}”.</div>}
        {shown.map((e) => {
          const meta = muscleMeta(e.muscle)
          return (
          <button key={e.id} className="ex-row" onClick={() => navigate(`/exercises/${e.id}`)}>
            <span className="ex-row-thumb" style={{ background: `${meta.color}26` }}><MuscleIcon muscle={e.muscle} /></span>
            <span className="ex-row-meta">
              <span className="ex-row-name">{e.name}</span>
              <span className="ex-row-sub">{[e.muscle, e.equipment].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="ex-row-arrow">›</span>
          </button>
          )
        })}
        {remaining > 0 && (
          <button className="ex-more" onClick={() => setLimit((l) => l + 60)}>
            Show more ({remaining.toLocaleString()} left)
          </button>
        )}
      </div>
    </div>
  )
}
