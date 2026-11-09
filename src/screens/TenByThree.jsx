import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import {
  PRESS_OPTIONS, SETS, REPS,
  fetchState, startState, logSession, updateConfig, resetState, startTenSession,
} from '../lib/tenByThree.js'
import './TenByThree.css'

function roundTo(n, step) { return Math.round(n / step) * step }

export default function TenByThree() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const unit = profile?.units || 'lb'
  const step = unit === 'kg' ? 2.5 : 5

  const [state, setState] = useState(undefined) // undefined loading, null not started, obj active
  const [outcome, setOutcome] = useState(null)
  const [setsDone, setSetsDone] = useState(SETS)
  const [busy, setBusy] = useState(false)

  function load() {
    fetchState(user?.id).then(({ data }) => setState(data))
  }
  useEffect(() => { load() }, [user?.id])

  if (state === undefined) {
    return (
      <div className="page t3">
        <StatusBar />
        <Bar navigate={navigate} />
        <div className="t3-loading">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page t3 fadeup">
      <StatusBar />
      <Bar navigate={navigate} />
      <header className="t3-head">
        <div className="t3-kicker">STRENGTH · AUTO-PROGRESSION</div>
        <h1 className="t3-title">10×3 Strength</h1>
        <p className="t3-sub">Ten sets of three heavy, clean reps. Weight only goes up once you finish a full 10×3.</p>
      </header>

      {state === null
        ? <Setup unit={unit} step={step} onStart={async (cfg) => {
            const { data } = await startState(user?.id, cfg)
            if (data) setState(data)
          }} />
        : <Session
            state={state} unit={state.unit || unit}
            setsDone={setsDone} setSetsDone={setSetsDone}
            outcome={outcome} setOutcome={setOutcome}
            busy={busy}
            onStartSession={() => { if (startTenSession(state)) navigate('/workout') }}
            onRecord={async () => {
              setBusy(true)
              const res = await logSession(user?.id, state, setsDone)
              setBusy(false)
              if (res.error) return alert(res.error.message)
              setState(res.data)
              setSetsDone(SETS)
              setOutcome({ completedAll: res.completedAll, nextWeight: res.nextWeight, done: res.entry.sets_completed })
            }}
            onReset={async () => {
              if (!window.confirm('Reset the 10×3 program? Your weight, week and history will be cleared.')) return
              await resetState(user?.id)
              setState(null); setOutcome(null)
            }}
            onAdjust={async (patch) => {
              const { data } = await updateConfig(user?.id, patch)
              if (data) setState(data)
            }}
          />}
    </div>
  )
}

function Bar({ navigate }) {
  return (
    <div className="t3-bar">
      <button className="t3-back" onClick={() => navigate('/programs')}>‹</button>
      <span className="t3-bar-title">10×3</span>
      <span style={{ width: 34 }} />
    </div>
  )
}

function Setup({ unit, step, onStart }) {
  const [exercise, setExercise] = useState(PRESS_OPTIONS[0])
  const [weight, setWeight] = useState('')
  const [increment, setIncrement] = useState(step)
  const [oneRm, setOneRm] = useState('')
  const suggested = oneRm ? roundTo(Number(oneRm) * 0.8, step) : null

  return (
    <div className="t3-card">
      <div className="t3-card-title">Set up your program</div>

      <label className="t3-label">Primary press</label>
      <select className="t3-input" value={exercise} onChange={(e) => setExercise(e.target.value)}>
        {PRESS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
      </select>

      <label className="t3-label">Starting weight ({unit})</label>
      <input className="t3-input" type="number" inputMode="numeric" value={weight}
        onChange={(e) => setWeight(e.target.value)} placeholder={`Working weight in ${unit}`} />
      <div className="t3-hint">Pick ~80% of your 1-rep max — a weight you could manage for 5–6 reps, but you’ll only do 3. Leave 2–3 in the tank every set.</div>

      <div className="t3-1rm">
        <span className="t3-1rm-label">Know your 1RM?</span>
        <input className="t3-input t3-1rm-input" type="number" inputMode="numeric" value={oneRm}
          onChange={(e) => setOneRm(e.target.value)} placeholder={unit} />
        {suggested ? (
          <button className="t3-1rm-use" onClick={() => setWeight(String(suggested))}>Use 80% = {suggested}</button>
        ) : <span className="t3-1rm-hint">→ suggests 80%</span>}
      </div>

      <label className="t3-label">Weekly increment ({unit})</label>
      <input className="t3-input" type="number" inputMode="numeric" value={increment}
        onChange={(e) => setIncrement(e.target.value)} />
      <div className="t3-hint">Added automatically after any fully-completed 10×3.</div>

      <button className="t3-primary" disabled={!weight || Number(weight) <= 0}
        onClick={() => onStart({ exercise, unit, weight, increment })}>
        Start program
      </button>
    </div>
  )
}

function Session({ state, unit, setsDone, setSetsDone, outcome, setOutcome, busy, onStartSession, onRecord, onReset, onAdjust }) {
  const [showAdjust, setShowAdjust] = useState(false)
  const history = [...(state.sessions || [])].reverse()
  const lastEntry = history[0]

  return (
    <>
      {/* current session */}
      <div className="t3-card">
        <div className="t3-week">Week {state.week}</div>
        <div className="t3-target">
          <span className="t3-target-num">{state.weight}</span>
          <span className="t3-target-unit">{unit}</span>
        </div>
        <div className="t3-exercise">{state.exercise}</div>
        <div className="t3-goal">{SETS} sets × {REPS} reps · heavy &amp; clean</div>

        <div className="t3-reminders">
          <span className="t3-chip">3 clean reps · stop shy of failure</span>
          <span className="t3-chip">Rest 60–90s</span>
          <span className="t3-chip">2–3s down · explosive up</span>
          <span className="t3-chip">Warm up first (not counted)</span>
        </div>

        {lastEntry && !lastEntry.completed_all && (
          <div className="t3-chase">Last time you hit {lastEntry.sets_completed}/{SETS} at this weight — chase all {SETS} this session.</div>
        )}

        <button className="t3-primary" onClick={onStartSession}>Start session →</button>
        <div className="t3-note">Loads 10 sets × 3 at {state.weight} {unit} into your workout logger.</div>
      </div>

      {/* record result */}
      <div className="t3-card">
        <div className="t3-card-title">After your session</div>
        <div className="t3-hint" style={{ marginTop: 0 }}>How many of the {SETS} sets did you complete cleanly?</div>

        <div className="t3-stepper">
          <button className="t3-step-btn" onClick={() => setSetsDone((n) => Math.max(0, n - 1))}>−</button>
          <div className="t3-step-val">{setsDone}<span>/{SETS}</span></div>
          <button className="t3-step-btn" onClick={() => setSetsDone((n) => Math.min(SETS, n + 1))}>+</button>
        </div>
        <div className="t3-dots">
          {Array.from({ length: SETS }, (_, i) => (
            <button key={i} className={'t3-dot' + (i < setsDone ? ' on' : '')} onClick={() => setSetsDone(i + 1)} aria-label={`${i + 1} sets`} />
          ))}
        </div>

        <button className="t3-primary alt" onClick={onRecord} disabled={busy}>
          {busy ? 'Saving…' : 'Record & progress'}
        </button>

        {outcome && (
          <div className={'t3-outcome' + (outcome.completedAll ? ' win' : '')}>
            {outcome.completedAll
              ? <>🎉 Full 10×3 — you earned it. Next session: <b>{outcome.nextWeight} {unit}</b>.</>
              : <>Logged {outcome.done}/{SETS}. Keep <b>{state.weight} {unit}</b> next session and chase the rest.</>}
          </div>
        )}
      </div>

      {/* history */}
      {history.length > 0 && (
        <div className="t3-card">
          <div className="t3-card-title">History</div>
          <div className="t3-history">
            {history.map((s, i) => (
              <div key={i} className="t3-hist-row">
                <span className="t3-hist-week">Wk {s.week}</span>
                <span className="t3-hist-weight">{s.weight} {unit}</span>
                <span className={'t3-hist-sets' + (s.completed_all ? ' full' : '')}>
                  {s.sets_completed}/{SETS}{s.completed_all ? ' ✓' : ''}
                </span>
                <span className="t3-hist-date">{s.date?.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* adjust / reset */}
      <div className="t3-card">
        {!showAdjust ? (
          <button className="t3-link" onClick={() => setShowAdjust(true)}>Adjust weight or exercise ⌄</button>
        ) : (
          <AdjustPanel state={state} unit={unit} onAdjust={onAdjust} onClose={() => setShowAdjust(false)} />
        )}
        <button className="t3-link danger" onClick={onReset}>Reset program</button>
      </div>
    </>
  )
}

function AdjustPanel({ state, unit, onAdjust, onClose }) {
  const [exercise, setExercise] = useState(state.exercise)
  const [weight, setWeight] = useState(String(state.weight))
  const [increment, setIncrement] = useState(String(state.increment))
  return (
    <div className="t3-adjust">
      <label className="t3-label">Primary press</label>
      <select className="t3-input" value={exercise} onChange={(e) => setExercise(e.target.value)}>
        {PRESS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
      </select>
      <div className="t3-two">
        <div>
          <label className="t3-label">Weight ({unit})</label>
          <input className="t3-input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label className="t3-label">Increment ({unit})</label>
          <input className="t3-input" type="number" value={increment} onChange={(e) => setIncrement(e.target.value)} />
        </div>
      </div>
      <div className="t3-adjust-actions">
        <button className="t3-link" onClick={onClose}>Cancel</button>
        <button className="t3-primary compact" onClick={() => {
          onAdjust({ exercise, weight: Number(weight) || 0, increment: Number(increment) || 0 })
          onClose()
        }}>Save</button>
      </div>
    </div>
  )
}
