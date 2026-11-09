import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { fetchChallenges, getChallengeCached, fetchJoined, computeProgress, daysLeft } from '../lib/challenges.js'
import { fetchWorkoutHistory } from '../lib/workouts.js'
import { useAuth } from '../lib/auth.jsx'
import './Challenges.css'

export default function Challenges() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [joined, setJoined] = useState([])
  const [history, setHistory] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([fetchChallenges(), fetchJoined(user?.id), fetchWorkoutHistory(user?.id)]).then(([c, j, h]) => {
      if (!alive) return
      setChallenges(c)
      setJoined(j.data)
      setHistory(h.data || [])
      setLoaded(true)
    })
    return () => { alive = false }
  }, [user?.id])

  const joinedIds = useMemo(() => new Set(joined.map((j) => j.challenge_id)), [joined])
  const mine = joined.map((j) => ({ row: j, challenge: getChallengeCached(j.challenge_id) })).filter((x) => x.challenge)
  const browse = challenges.filter((c) => !joinedIds.has(c.id))

  return (
    <div className="page challenges fadeup">
      <StatusBar />
      <div className="ch-bar">
        <button className="ch-back" onClick={() => navigate('/')}>‹</button>
        <span className="ch-bar-title">Challenges</span>
        <span style={{ width: 34 }} />
      </div>

      <header className="ch-head">
        <h1 className="ch-title">Challenges</h1>
        <p className="ch-sub">Join a challenge, track your progress, chase the finish line.</p>
      </header>

      {loaded && mine.length > 0 && (
        <>
          <div className="section-head"><span className="section-title">Your challenges</span></div>
          <div className="ch-list">
            {mine.map(({ row, challenge }) => {
              const p = computeProgress(challenge, row, history)
              return (
                <button key={challenge.id} className="ch-active" onClick={() => navigate(`/challenges/${challenge.id}`)}>
                  <img src={challenge.image} alt="" className="ch-active-img" />
                  <div className="ch-active-body">
                    <div className="ch-active-title">{challenge.title}</div>
                    <div className="ch-bar"><div className="ch-bar-fill" style={{ width: `${p.pct}%` }} /></div>
                    <div className="ch-active-meta">
                      {p.done ? '✓ Complete' : `${p.value} / ${p.goal} ${challenge.unit}`} · {daysLeft(challenge, row)}d left
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="section-head">
        <span className="section-title">{mine.length > 0 ? 'Join more' : 'Browse challenges'}</span>
      </div>
      <div className="ch-browse">
        {browse.map((c) => (
          <button key={c.id} className="ch-card" onClick={() => navigate(`/challenges/${c.id}`)}>
            <img src={c.image} alt="" />
            <div className="ch-card-scrim" />
            <span className="ch-card-tag">{c.tag}</span>
            <div className="ch-card-body">
              <div className="ch-card-title">{c.title}</div>
              <div className="ch-card-sub">{c.participants.toLocaleString()} in · {c.goal} {c.unit}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
