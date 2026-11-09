import { useEffect, useMemo, useState } from 'react'
import { searchExercises, muscleOrder } from '../data/exercises.js'
import { loadExercises, addCustomExercise, bundledExercises } from '../lib/exerciseRepo.js'
import { useAuth } from '../lib/auth.jsx'
import './ExercisePicker.css'

export default function ExercisePicker({ onAdd, onClose }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState([]) // ids added this session (for the ✓ flash)
  const [list, setList] = useState(bundledExercises)
  const [creating, setCreating] = useState(false)

  const CAP = 80 // cap rendered rows so 2,250+ exercises don't all mount

  // Load from the DB (cached); updates in place when the fresh copy arrives.
  useEffect(() => {
    setList(loadExercises(user?.id, (fresh) => setList(fresh)))
  }, [user?.id])

  const results = useMemo(() => searchExercises(list, query), [list, query])
  const shown = results.slice(0, CAP)
  const moreCount = results.length - shown.length

  // Offer "create" when the typed name isn't already an exact match.
  const trimmed = query.trim()
  const exactExists = useMemo(
    () => list.some((e) => e.name.toLowerCase() === trimmed.toLowerCase()),
    [list, trimmed]
  )
  const canCreate = trimmed.length >= 2 && !exactExists

  const grouped = useMemo(() => {
    const map = new Map()
    shown.forEach((e) => {
      if (!map.has(e.muscle)) map.set(e.muscle, [])
      map.get(e.muscle).push(e)
    })
    return muscleOrder
      .filter((m) => map.has(m))
      .map((m) => [m, map.get(m)])
      .concat([...map.keys()].filter((m) => !muscleOrder.includes(m)).map((m) => [m, map.get(m)]))
  }, [shown])

  function handleAdd(ex) {
    onAdd(ex)
    setAdded((a) => [...a, ex.id])
  }

  async function handleCreate() {
    if (!canCreate || creating) return
    setCreating(true)
    const { data, error } = await addCustomExercise(user?.id, { name: trimmed })
    setCreating(false)
    if (error) { alert(`Couldn’t save exercise: ${error.message}`); return }
    setList(loadExercises(user?.id, (fresh) => setList(fresh)))
    handleAdd(data)
    setQuery('')
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="picker-grip" />
        <div className="picker-head">
          <span className="picker-title">Add exercise</span>
          <button className="picker-done" onClick={onClose}>Done</button>
        </div>

        <div className="picker-search">
          <span className="picker-search-icon">⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create an exercise"
            className="picker-input"
          />
          {query && <button className="picker-clear" onClick={() => setQuery('')}>✕</button>}
        </div>

        <div className="picker-count">
          {results.length.toLocaleString()} exercise{results.length !== 1 ? 's' : ''}
          {query ? '' : ' · type to search'}
        </div>

        <div className="picker-list scrl">
          {canCreate && (
            <button className="picker-create" onClick={handleCreate} disabled={creating}>
              <span className="picker-create-plus">＋</span>
              <span className="picker-create-text">
                {creating ? 'Saving…' : <>Create <b>“{trimmed}”</b></>}
                <span className="picker-create-sub">Add your own custom exercise</span>
              </span>
            </button>
          )}

          {results.length === 0 && !canCreate && (
            <div className="picker-empty">No exercises match “{query}”.</div>
          )}

          {grouped.map(([muscle, items]) => (
            <div key={muscle} className="picker-group">
              <div className="picker-group-label">{muscle}</div>
              {items.map((ex) => {
                const isAdded = added.includes(ex.id)
                return (
                  <button key={ex.id} className="picker-row" onClick={() => handleAdd(ex)}>
                    <div className="picker-row-meta">
                      <div className="picker-row-name">{ex.name}</div>
                      <div className="picker-row-sub">
                        {[ex.equipment, ex.difficulty].filter(Boolean).join(' · ') || 'Custom exercise'}
                      </div>
                    </div>
                    <span className={`picker-add${isAdded ? ' added' : ''}`}>
                      {isAdded ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
          {moreCount > 0 && (
            <div className="picker-more">
              + {moreCount.toLocaleString()} more — keep typing to narrow it down
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
