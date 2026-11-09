import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import SweatBar from '../components/SweatBar.jsx'
import { programs, getProgram } from '../data/programs.js'
import { fetchFollowed } from '../lib/programs.js'
import { useAuth } from '../lib/auth.jsx'
import './Programs.css'

export default function Programs() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [followed, setFollowed] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    fetchFollowed(user?.id).then(({ data }) => {
      if (!alive) return
      setFollowed(data)
      setLoaded(true)
    })
    return () => { alive = false }
  }, [user?.id])

  const followedIds = useMemo(() => new Set(followed.map((f) => f.program_id)), [followed])
  const mine = followed.map((f) => ({ ...f, program: getProgram(f.program_id) })).filter((f) => f.program)
  const browse = programs.filter((p) => !followedIds.has(p.id))

  return (
    <div className="page programs fadeup">
      <StatusBar />
      <SweatBar />
      <header className="pg-head">
        <h1 className="pg-title">Programs</h1>
        <p className="pg-sub">Structured plans that tell you exactly what to train.</p>
      </header>

      {loaded && mine.length > 0 && (
        <>
          <div className="section-head"><span className="section-title">Your programs</span></div>
          <div className="pg-mine">
            {mine.map(({ program, current_week }) => (
              <button key={program.id} className="pg-active-card" onClick={() => navigate(`/programs/${program.id}`)}>
                <div className="pg-active-media">
                  <img src={program.image} alt="" />
                  <span className="pg-active-badge">{program.daysPerWeek} DAYS / WK</span>
                </div>
                <div className="pg-active-body">
                  <div className="pg-active-name">{program.name}</div>
                  <div className="pg-bar"><div className="pg-bar-fill" style={{ width: `${Math.min(100, Math.round((current_week / program.weeks) * 100))}%` }} /></div>
                  <div className="pg-active-meta">Week {current_week} of {program.weeks}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="section-head">
        <span className="section-title">{mine.length > 0 ? 'Browse more' : 'Browse programs'}</span>
      </div>
      <div className="pg-browse">
        <button className="pg-card" onClick={() => navigate('/ten-by-three')}>
          <div className="pg-card-media">
            <img src="/assets/prog1.webp" alt="" />
            <div className="pg-card-scrim" />
            <span className="pg-card-tag">Advanced</span>
            <div className="pg-card-title">10×3 Strength</div>
          </div>
          <div className="pg-card-body">
            <p className="pg-card-summary">Ten heavy sets of three. Auto-regulating — the weight only climbs once you finish a full 10×3.</p>
            <div className="pg-card-stats">
              <span>10 × 3</span>
              <span>~80–85% 1RM</span>
              <span className="accent">Strength</span>
            </div>
          </div>
        </button>
        {browse.map((p) => (
          <button key={p.id} className="pg-card" onClick={() => navigate(`/programs/${p.id}`)}>
            <div className="pg-card-media">
              <img src={p.image} alt="" />
              <div className="pg-card-scrim" />
              <span className="pg-card-tag">{p.level}</span>
              <div className="pg-card-title">{p.name}</div>
            </div>
            <div className="pg-card-body">
              <p className="pg-card-summary">{p.summary}</p>
              <div className="pg-card-stats">
                <span>{p.daysPerWeek} days / wk</span>
                <span>{p.weeks} weeks</span>
                <span className="accent">{p.goal}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
