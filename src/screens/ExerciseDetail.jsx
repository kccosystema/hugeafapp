import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { getExerciseById } from '../lib/exerciseRepo.js'
import { addExerciseToActiveWorkout } from '../lib/workoutStore.js'
import './ExerciseDetail.css'

// Pull the 11-char video id out of a youtu.be / watch?v= / embed URL.
function youtubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)
  return m ? m[1] : null
}

export default function ExerciseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ex, setEx] = useState(undefined) // undefined = loading, null = not found

  useEffect(() => {
    let alive = true
    getExerciseById(id).then((e) => { if (alive) setEx(e) })
    return () => { alive = false }
  }, [id])

  if (ex === undefined) {
    return (
      <div className="page exdetail">
        <StatusBar />
        <BackBar onBack={() => navigate(-1)} />
        <div className="exd-msg">Loading…</div>
      </div>
    )
  }

  if (ex === null) {
    return (
      <div className="page exdetail">
        <StatusBar />
        <BackBar onBack={() => navigate('/exercises')} />
        <div className="exd-msg">Exercise not found.</div>
      </div>
    )
  }

  function addToWorkout() {
    addExerciseToActiveWorkout(ex)
    navigate('/workout')
  }

  const vid = youtubeId(ex.video)
  const facts = [
    ['Target muscle', ex.muscle],
    ['Equipment', ex.equipment],
    ['Difficulty', ex.difficulty],
    ['Body region', ex.region],
    ['Mechanics', ex.mechanics],
  ].filter(([, v]) => v)

  return (
    <div className="page exdetail fadeup">
      <StatusBar />
      <BackBar onBack={() => navigate(-1)} />

      <div className="exd-body">
        <div className="exd-kicker">{ex.muscle}{ex.user_id ? ' · Custom' : ''}</div>
        <h1 className="exd-name">{ex.name}</h1>

        {vid ? (
          <div className="exd-video">
            <iframe
              src={`https://www.youtube.com/embed/${vid}`}
              title={`${ex.name} demo`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="exd-novideo">🎬 No demo video for this exercise yet</div>
        )}

        <button className="exd-add" onClick={addToWorkout}>＋ Add to workout</button>

        <div className="exd-facts">
          {facts.map(([k, v]) => (
            <div className="exd-fact" key={k}>
              <span className="exd-fact-k">{k}</span>
              <span className="exd-fact-v">{v}</span>
            </div>
          ))}
        </div>

        {ex.video && (
          <a className="exd-watch" href={ex.video} target="_blank" rel="noreferrer">
            Watch on YouTube ↗
          </a>
        )}
      </div>
    </div>
  )
}

function BackBar({ onBack }) {
  return (
    <div className="exd-bar">
      <button className="exd-back" onClick={onBack} aria-label="Back">‹</button>
      <span className="exd-bar-title">Exercise</span>
      <span style={{ width: 34 }} />
    </div>
  )
}
