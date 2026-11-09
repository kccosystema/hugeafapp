import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { fetchGuide } from '../lib/formGuides.js'
import './FormGuides.css'

export default function FormGuideDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [guide, setGuide] = useState(undefined) // undefined loading, null missing

  useEffect(() => {
    let alive = true
    fetchGuide(id).then((g) => { if (alive) setGuide(g) })
    return () => { alive = false }
  }, [id])

  function share() {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: guide?.title, url }).catch(() => {})
    else { navigator.clipboard?.writeText(url); alert('Link copied') }
  }

  return (
    <div className="page fgd fadeup">
      <StatusBar />
      <div className="fg-bar">
        <button className="fg-back" onClick={() => navigate('/guides')}>‹</button>
        <span className="fg-bar-title">{guide?.title || 'Form Guide'}</span>
        <button className="fg-back" onClick={share} aria-label="Share">↗</button>
      </div>

      {guide === undefined ? (
        <div className="fg-empty">Loading…</div>
      ) : !guide ? (
        <div className="fg-empty">Guide not found.</div>
      ) : (
        <div className="fgd-body">
          <div className="fgd-cat">{(guide.category || '').toUpperCase()}</div>
          <h1 className="fgd-title">{guide.title}</h1>
          <img className="fgd-img" src={guide.image} alt={guide.title} />
        </div>
      )}
    </div>
  )
}
