import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { fetchGuides } from '../lib/formGuides.js'
import './FormGuides.css'

export default function FormGuides() {
  const navigate = useNavigate()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')

  useEffect(() => {
    fetchGuides().then((g) => { setGuides(g); setLoading(false) })
  }, [])

  const categories = useMemo(() => {
    const s = new Set(guides.map((g) => g.category).filter(Boolean))
    return ['All', ...Array.from(s)]
  }, [guides])

  const list = cat === 'All' ? guides : guides.filter((g) => g.category === cat)

  return (
    <div className="page fg fadeup">
      <StatusBar />
      <div className="fg-bar">
        <button className="fg-back" onClick={() => navigate('/')}>‹</button>
        <span className="fg-bar-title">Form Guides</span>
        <span style={{ width: 34 }} />
      </div>

      <header className="fg-head">
        <h1 className="fg-title">Form Guides</h1>
        <p className="fg-sub">Nail your technique — muscles worked, form tips, and common mistakes.</p>
      </header>

      {categories.length > 2 && (
        <div className="fg-chips scrl">
          {categories.map((c) => (
            <button key={c} className={`fg-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="fg-empty">Loading…</div>
      ) : list.length === 0 ? (
        <div className="fg-empty">No guides in this category yet.</div>
      ) : (
        <div className="fg-grid">
          {list.map((g) => (
            <button key={g.id} className="fg-card" onClick={() => navigate(`/guides/${g.id}`)}>
              <div className="fg-card-media">
                <img src={g.image} alt={g.title} loading="lazy" />
                <div className="fg-card-scrim" />
                <span className="fg-card-cat">{(g.category || '').toUpperCase()}</span>
                <div className="fg-card-title">{g.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
