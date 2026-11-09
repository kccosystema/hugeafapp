import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { fetchChallenges, getChallengeCached, fetchJoined, joinChallenge, leaveChallenge, updateProgress, computeProgress, daysLeft, todayKey } from '../lib/challenges.js'
import { fetchWorkoutHistory } from '../lib/workouts.js'
import { useAuth } from '../lib/auth.jsx'
import './ChallengeDetail.css'

export default function ChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(undefined) // undefined loading, null not found, obj found

  const [row, setRow] = useState(undefined) // undefined loading, null not joined, obj joined
  const [history, setHistory] = useState([])
  const [count, setCount] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([fetchChallenges(), fetchJoined(user?.id), fetchWorkoutHistory(user?.id)]).then(([, j, h]) => {
      if (!alive) return
      setChallenge(getChallengeCached(id))
      setRow(j.data.find((r) => r.challenge_id === id) || null)
      setHistory(h.data || [])
    })
    return () => { alive = false }
  }, [user?.id, id])

  if (challenge === undefined) {
    return (
      <div className="page chd">
        <StatusBar />
        <div className="chd-bar"><button className="chd-back" onClick={() => navigate('/challenges')}>‹</button></div>
        <div className="chd-msg">Loading…</div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="page chd">
        <StatusBar />
        <div className="chd-bar"><button className="chd-back" onClick={() => navigate('/challenges')}>‹</button></div>
        <div className="chd-msg">Challenge not found.</div>
      </div>
    )
  }

  const joined = !!row
  const p = computeProgress(challenge, row, history)

  async function join() {
    if (busy) return
    setBusy(true)
    const { data, error } = await joinChallenge(user?.id, challenge.id)
    setBusy(false)
    if (error) return alert(error.message)
    setRow(data || { challenge_id: challenge.id, progress: 0, completed: false, joined_at: new Date().toISOString(), last_checkin: null })
  }

  async function leave() {
    if (!window.confirm('Leave this challenge? Your progress will be cleared.')) return
    setBusy(true)
    await leaveChallenge(user?.id, challenge.id)
    setBusy(false)
    setRow(null)
  }

  async function patch(next) {
    setRow((r) => ({ ...r, ...next })) // optimistic
    await updateProgress(user?.id, challenge.id, next)
  }

  const checkedToday = row?.last_checkin === todayKey()

  function checkIn() {
    if (checkedToday) return
    const value = Math.min(challenge.goal, (Number(row.progress) || 0) + 1)
    patch({ progress: value, last_checkin: todayKey(), completed: value >= challenge.goal })
  }
  function addReps() {
    const amt = Number(count)
    if (!amt || amt <= 0) return
    const value = (Number(row.progress) || 0) + amt
    patch({ progress: value, completed: value >= challenge.goal })
    setCount('')
  }
  function markPr() {
    patch({ progress: challenge.goal, completed: true })
  }

  return (
    <div className="page chd fadeup">
      <StatusBar />

      <div className="chd-hero">
        <img src={challenge.image} alt="" className="chd-hero-img" />
        <div className="chd-hero-scrim" />
        <button className="chd-back floating" onClick={() => navigate('/challenges')} aria-label="Back">‹</button>
        <div className="chd-hero-body">
          <span className="chd-tag">{challenge.tag}</span>
          <h1 className="chd-title">{challenge.title}</h1>
          <div className="chd-participants">{challenge.participants.toLocaleString()} lifters in</div>
        </div>
      </div>

      <div className="chd-body">
        {/* progress ring */}
        <div className="chd-ring-wrap">
          <Ring pct={p.pct} />
          <div className="chd-ring-center">
            <div className="chd-ring-value">{p.value}<span>/{p.goal}</span></div>
            <div className="chd-ring-unit">{challenge.unit}</div>
          </div>
        </div>
        {joined && (
          <div className="chd-daysleft">{p.done ? '🎉 Challenge complete!' : `${daysLeft(challenge, row)} days left`}</div>
        )}

        <p className="chd-summary">{challenge.summary}</p>

        {!joined ? (
          <button className="chd-primary" onClick={join} disabled={busy}>Join challenge</button>
        ) : (
          <>
            {/* type-specific action */}
            {challenge.type === 'daily' && (
              <button className="chd-primary" onClick={checkIn} disabled={checkedToday || p.done}>
                {p.done ? 'Done ✓' : checkedToday ? 'Checked in today ✓' : 'Check in for today'}
              </button>
            )}
            {challenge.type === 'count' && !p.done && (
              <div className="chd-count-row">
                <input className="chd-count-input" type="number" inputMode="numeric" value={count}
                  onChange={(e) => setCount(e.target.value)} placeholder={`Add ${challenge.unit}`} />
                <button className="chd-primary compact" onClick={addReps}>Add</button>
              </div>
            )}
            {challenge.type === 'pr' && (
              <button className="chd-primary" onClick={markPr} disabled={p.done}>
                {p.done ? 'PR logged ✓' : 'I hit a new PR 💪'}
              </button>
            )}
            {challenge.type === 'workouts' && (
              <button className="chd-primary" onClick={() => navigate('/workout')} disabled={p.done}>
                {p.done ? 'Goal reached ✓' : 'Log a workout →'}
              </button>
            )}
            {challenge.type === 'workouts' && (
              <div className="chd-note">Counts automatically from workouts you finish.</div>
            )}

            <button className="chd-leave" onClick={leave} disabled={busy}>Leave challenge</button>
          </>
        )}
      </div>
    </div>
  )
}

function Ring({ pct }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" className="chd-ring">
      <circle cx="66" cy="66" r={r} fill="none" stroke="#2A2733" strokeWidth="10" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--accent)" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        transform="rotate(-90 66 66)" />
    </svg>
  )
}
