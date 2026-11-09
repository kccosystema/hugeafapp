import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import MuscleIcon from '../components/MuscleIcon.jsx'
import { getProgram } from '../data/programs.js'
import { fetchFollowed, followProgram, unfollowProgram, setCurrentWeek, startProgramDay } from '../lib/programs.js'
import { muscleMeta } from '../data/exercises.js'
import { useAuth } from '../lib/auth.jsx'
import './ProgramDetail.css'

export default function ProgramDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const program = getProgram(id)

  const [following, setFollowing] = useState(false)
  const [week, setWeek] = useState(1)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetchFollowed(user?.id).then(({ data }) => {
      if (!alive) return
      const row = data.find((f) => f.program_id === id)
      setFollowing(!!row)
      if (row) setWeek(row.current_week)
    })
    return () => { alive = false }
  }, [user?.id, id])

  if (!program) {
    return (
      <div className="page prd">
        <StatusBar />
        <div className="prd-bar"><button className="prd-back" onClick={() => navigate('/programs')}>‹</button></div>
        <div className="prd-msg">Program not found.</div>
      </div>
    )
  }

  async function toggleFollow() {
    if (busy) return
    setBusy(true)
    if (following) {
      const { error } = await unfollowProgram(user?.id, program.id)
      if (!error) { setFollowing(false); setWeek(1) }
      else alert(error.message)
    } else {
      const { error } = await followProgram(user?.id, program.id)
      if (!error) { setFollowing(true); setWeek(1) }
      else alert(error.message)
    }
    setBusy(false)
  }

  async function advanceWeek() {
    const next = Math.min(program.weeks, week + 1)
    setWeek(next)
    await setCurrentWeek(user?.id, program.id, next)
  }

  function start(day) {
    if (startProgramDay(program, day)) navigate('/workout')
  }

  return (
    <div className="page prd fadeup">
      <StatusBar />

      {/* hero */}
      <div className="prd-hero">
        <img src={program.image} alt="" className="prd-hero-img" />
        <div className="prd-hero-scrim" />
        <button className="prd-back floating" onClick={() => navigate('/programs')} aria-label="Back">‹</button>
        <div className="prd-hero-body">
          <span className="prd-level">{program.level} · {program.goal}</span>
          <h1 className="prd-name">{program.name}</h1>
          <div className="prd-stats">
            <span>{program.daysPerWeek} days / wk</span>
            <span>{program.weeks} weeks</span>
            <span>{program.days.length} unique days</span>
          </div>
        </div>
      </div>

      <div className="prd-body">
        <p className="prd-summary">{program.summary}</p>

        <button className={`prd-follow${following ? ' following' : ''}`} onClick={toggleFollow} disabled={busy}>
          {following ? '✓ Following' : '＋ Follow program'}
        </button>

        {following && (
          <div className="prd-progress">
            <div>
              <div className="prd-progress-label">Your progress</div>
              <div className="prd-progress-week">Week {week} of {program.weeks}</div>
            </div>
            {week < program.weeks && (
              <button className="prd-next-week" onClick={advanceWeek}>Next week →</button>
            )}
          </div>
        )}

        <div className="prd-split-label">The split</div>
        <div className="prd-days">
          {program.days.map((day) => (
            <div key={day.name} className="prd-day">
              <div className="prd-day-head">
                <div>
                  <div className="prd-day-name">{day.name}</div>
                  <div className="prd-day-focus">{day.focus}</div>
                </div>
                <span className="prd-day-count">{day.exercises.length} exercises</span>
              </div>
              <div className="prd-ex-list">
                {day.exercises.map((ex, i) => (
                  <div key={i} className="prd-ex">
                    <span className="prd-ex-icon" style={{ background: `${muscleMeta(ex.muscle).color}26` }}>
                      <MuscleIcon muscle={ex.muscle} size={20} />
                    </span>
                    <span className="prd-ex-name">{ex.name}</span>
                    <span className="prd-ex-target">{ex.sets} × {ex.reps}</span>
                  </div>
                ))}
              </div>
              <button className="prd-start" onClick={() => start(day)}>Start {day.name} →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
