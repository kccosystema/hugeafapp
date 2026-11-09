import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { todaysWorkout } from '../data/workout.js'

// Lazy so the 2,250-exercise database only downloads when the picker opens.
const ExercisePicker = lazy(() => import('../components/ExercisePicker.jsx'))
import { getActiveWorkout, saveActiveWorkout, clearActiveWorkout } from '../lib/workoutStore.js'
import { saveFinishedWorkout, fetchExerciseHistory, fetchWorkoutHistory, fetchExerciseCounts } from '../lib/workouts.js'
import { sweatForWorkout, awardSweat, levelFromTotal, queueSweatSplash } from '../lib/sweat.js'
import { computeStreak } from '../lib/stats.js'
import { suggestExercises, MAJOR_GROUPS, majorGroup, resolveMuscle, recommendedForGroup } from '../lib/suggest.js'
import { useAuth } from '../lib/auth.jsx'
import './Workout.css'

const uid = () => Math.random().toString(36).slice(2, 9)

function emptySet(prev) {
  return { id: uid(), prev: prev || '', lb: '', reps: '', done: false }
}

function newWorkout(title = 'New workout', subtitle = '') {
  return { startedAt: Date.now(), title, subtitle, exercises: [] }
}

// Build a workout prefilled with a list of exercises (Home "Suggested for you").
function fromSeed(seed) {
  return {
    startedAt: Date.now(),
    title: 'Suggested workout',
    subtitle: 'Your go-to movements',
    exercises: seed.map((e) => ({
      uid: uid(),
      exerciseId: e.exerciseId || e.id || null,
      name: e.name,
      muscle: e.muscle || null,
      sets: [emptySet()],
    })),
  }
}

// Build a workout from the seed "Push Day" template (used by the hero CTA).
function fromTemplate() {
  return {
    startedAt: Date.now(),
    title: todaysWorkout.title,
    subtitle: todaysWorkout.subtitle,
    exercises: todaysWorkout.exercises.map((e) => ({
      uid: uid(),
      exerciseId: e.id,
      name: e.name,
      image: e.image,
      target: e.target,
      last: e.last,
      sets: e.sets.map((s) => ({ id: uid(), prev: s.prev, lb: s.lb, reps: s.reps, done: !!s.done })),
    })),
  }
}

export default function Workout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, setProfile } = useAuth()

  const [workout, setWorkout] = useState(() => {
    // `fresh` forces a brand-new workout (discarding any). Otherwise an
    // in-progress workout always wins so we never silently clobber logged sets
    // (incl. on reload, where router history-state can linger).
    if (location.state?.fresh) return newWorkout()
    const active = getActiveWorkout()
    if (active) return active
    if (location.state?.seed?.length) return fromSeed(location.state.seed)
    if (location.state?.template === 'push-day') return fromTemplate()
    return newWorkout()
  })
  const [picking, setPicking] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [finished, setFinished] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error | skipped
  const [sweat, setSweat] = useState(null) // { amount, breakdown, before, after, leveledTo }
  const [prevMap, setPrevMap] = useState({}) // exercise name → last session's sets
  const [allExercises, setAllExercises] = useState(null) // full DB, for suggestions
  const [exCounts, setExCounts] = useState([]) // user's most-used exercises
  const [manualGroup, setManualGroup] = useState(null) // null=auto, ''=cleared, else a group
  const bodyRef = useRef(null)

  // Lazy-load the exercise DB once the session has an exercise OR the user opens
  // the muscle-group quick-add, so the ~70KB data chunk stays out of the initial bundle.
  const exCount = workout.exercises.length
  useEffect(() => {
    if (allExercises || (exCount === 0 && !manualGroup)) return
    let alive = true
    import('../lib/exerciseRepo.js').then(({ loadExercises }) => {
      const list = loadExercises(user?.id, (fresh) => { if (alive) setAllExercises(fresh) })
      if (alive) setAllExercises(list)
    })
    return () => { alive = false }
  }, [exCount, manualGroup, allExercises, user?.id])

  // The user's most-used exercises (for the quick-add chips).
  useEffect(() => {
    let alive = true
    fetchExerciseCounts(user?.id).then((c) => { if (alive) setExCounts(c) })
    return () => { alive = false }
  }, [user?.id])

  const suggestions = useMemo(
    () => (allExercises ? suggestExercises(workout, allExercises, 8) : []),
    [workout, allExercises],
  )

  // Total exercises logged per major group (badges on the chips).
  const groupCounts = useMemo(() => {
    const out = {}
    for (const p of exCounts) {
      const g = majorGroup(resolveMuscle(p, allExercises || []))
      if (g) out[g] = (out[g] || 0) + p.count
    }
    return out
  }, [exCounts, allExercises])

  // Auto-pick the group that matches what's already in the session.
  const sessionGroup = useMemo(() => {
    const tally = {}
    for (const e of workout.exercises) {
      const g = majorGroup(resolveMuscle(e, allExercises || []))
      if (g) tally[g] = (tally[g] || 0) + 1
    }
    let best = null
    for (const g of Object.keys(tally)) if (!best || tally[g] > tally[best]) best = g
    return best
  }, [workout, allExercises])

  // Effective selection: manual choice wins; otherwise follow the session.
  const activeGroup = manualGroup === null ? sessionGroup : (manualGroup || null)

  // Quick-add chips for the active muscle group: the user's own past exercises
  // first, falling back to popular DB exercises for that group.
  const quickPicks = useMemo(() => {
    if (!activeGroup) return { items: [], recommended: false }
    const added = new Set(workout.exercises.map((e) => (e.name || '').trim().toLowerCase()))
    const hist = exCounts
      .filter((p) => majorGroup(resolveMuscle(p, allExercises || [])) === activeGroup)
      .filter((p) => !added.has(p.name.trim().toLowerCase()))
      .slice(0, 10)
      .map((p) => ({ name: p.name, exerciseId: p.exerciseId, muscle: p.muscle, count: p.count }))
    if (hist.length) return { items: hist, recommended: false }
    // No history for this group → curated recommendations.
    const recs = recommendedForGroup(activeGroup, added, 8)
      .map((e) => ({ name: e.name, exerciseId: null, muscle: e.muscle, count: 0 }))
    return { items: recs, recommended: true }
  }, [activeGroup, exCounts, allExercises, workout])

  function addQuick(p) {
    addExercise({ id: p.exerciseId || p.name, name: p.name, muscle: resolveMuscle(p, allExercises || []) || p.muscle || null })
  }

  // previous-performance lookup (so users can try to beat last time)
  useEffect(() => {
    let alive = true
    fetchExerciseHistory(user?.id).then((m) => { if (alive) setPrevMap(m) })
    return () => { alive = false }
  }, [user?.id])

  function historyFor(name) {
    return prevMap[(name || '').trim().toLowerCase()] || null
  }
  function prevSetText(name, setIdx) {
    const h = historyFor(name)
    if (!h || !h.sets.length) return null
    const s = h.sets[setIdx] || h.sets[h.sets.length - 1]
    return `${s.lb}×${s.reps}`
  }

  // persist on every change while in progress
  useEffect(() => {
    if (!finished) saveActiveWorkout(workout)
  }, [workout, finished])

  // elapsed ticker
  useEffect(() => {
    if (finished) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [finished])

  const totals = useMemo(() => {
    let setsDone = 0, volume = 0, exDone = 0, totalSets = 0
    workout.exercises.forEach((ex) => {
      totalSets += ex.sets.length
      const done = ex.sets.filter((s) => s.done)
      setsDone += done.length
      done.forEach((s) => { volume += (Number(s.lb) || 0) * (Number(s.reps) || 0) })
      if (ex.sets.length && ex.sets.every((s) => s.done)) exDone += 1
    })
    return { setsDone, totalSets, exDone, volume }
  }, [workout])

  const elapsedSec = Math.max(0, Math.floor((now - workout.startedAt) / 1000))
  const mmss = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`

  function mutate(fn) {
    setWorkout((prev) => {
      const next = { ...prev, exercises: prev.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })) }
      fn(next)
      return next
    })
  }

  function addExercise(ex) {
    mutate((w) => {
      w.exercises.push({ uid: uid(), exerciseId: ex.id, name: ex.name, muscle: ex.muscle, sets: [emptySet()] })
    })
  }
  function removeExercise(exUid) {
    mutate((w) => { w.exercises = w.exercises.filter((e) => e.uid !== exUid) })
  }
  function addSet(exUid) {
    mutate((w) => {
      const ex = w.exercises.find((e) => e.uid === exUid)
      const last = ex.sets[ex.sets.length - 1]
      ex.sets.push(emptySet(last ? (last.lb && last.reps ? `${last.lb}×${last.reps}` : last.prev) : ''))
    })
  }
  function removeSet(exUid, setId) {
    mutate((w) => {
      const ex = w.exercises.find((e) => e.uid === exUid)
      ex.sets = ex.sets.filter((s) => s.id !== setId)
    })
  }
  function updateSet(exUid, setId, field, value) {
    mutate((w) => {
      const ex = w.exercises.find((e) => e.uid === exUid)
      const set = ex.sets.find((s) => s.id === setId)
      set[field] = value
    })
  }
  function toggleDone(exUid, setId) {
    mutate((w) => {
      const ex = w.exercises.find((e) => e.uid === exUid)
      const set = ex.sets.find((s) => s.id === setId)
      if (!set.done && set.prev) {
        const [plb, preps] = set.prev.split('×')
        if (set.lb === '') set.lb = Number(plb) || set.lb
        if (set.reps === '') set.reps = Number(preps) || set.reps
      }
      set.done = !set.done
    })
  }

  // Count exercises where this session's top set beat the previous best.
  function countPRs() {
    let n = 0
    workout.exercises.forEach((ex) => {
      const h = historyFor(ex.name)
      if (!h) return
      const prevBest = Math.max(0, ...h.sets.map((s) => s.lb))
      const nowBest = Math.max(0, ...ex.sets.filter((s) => s.done).map((s) => Number(s.lb) || 0))
      if (nowBest > 0 && nowBest > prevBest) n += 1
    })
    return n
  }

  async function finish() {
    clearActiveWorkout()
    setFinished(true)
    if (totals.setsDone > 0) {
      setSaveStatus('saving')
      const { error, skipped } = await saveFinishedWorkout(workout, totals, elapsedSec, user?.id)
      setSaveStatus(error ? 'error' : skipped ? 'skipped' : 'saved')

      // award Sweat (hybrid: finish + sets + volume + PRs + streak)
      if (!error) {
        const { data: hist } = await fetchWorkoutHistory(user?.id, 60)
        const hasStreak = computeStreak(hist) >= 2
        const { total: amount, breakdown } = sweatForWorkout(totals, countPRs(), hasStreak)
        const before = profile?.sweat || 0
        const { total: after } = await awardSweat(user?.id, amount)
        const newTotal = after ?? before + amount
        if (profile) setProfile({ ...profile, sweat: newTotal })
        const leveledTo = levelFromTotal(newTotal).level > levelFromTotal(before).level
          ? levelFromTotal(newTotal).level : null
        setSweat({ amount, breakdown, before, after: newTotal, leveledTo })
        queueSweatSplash(amount) // plays on the bar when they land back on Home
      }
    }
  }
  // Back arrow = leave but keep the workout so it can be resumed from Home.
  // An empty shell (no exercises) is cleared so it doesn't linger.
  function exit() {
    if (workout.exercises.length === 0) clearActiveWorkout()
    navigate('/')
  }
  function discard() {
    if (window.confirm('Discard this workout? Logged sets will be lost.')) {
      clearActiveWorkout()
      navigate('/')
    }
  }

  if (finished) {
    return <Summary workout={workout} totals={totals} elapsed={mmss} saveStatus={saveStatus} sweat={sweat} onClose={() => navigate('/')} />
  }

  const hasExercises = workout.exercises.length > 0
  const canFinish = totals.setsDone > 0

  return (
    <div className="workout">
      <StatusBar />

      <div className="wk-bar">
        <div className="wk-bar-row">
          <button className="wk-back" onClick={exit} aria-label="Leave workout">‹</button>
          <div className="wk-bar-title">
            <div className="wk-title">{workout.title}</div>
            {workout.subtitle && <div className="wk-subtitle">{workout.subtitle}</div>}
          </div>
          <button className="wk-finish" disabled={!canFinish} onClick={finish}>Finish</button>
        </div>
        <div className="wk-stats">
          <Live label="ELAPSED" value={mmss} />
          <Live label="EXERCISES" value={<>{totals.exDone}<span>/{workout.exercises.length}</span></>} />
          <Live label="SETS" value={<>{totals.setsDone}<span>/{totals.totalSets}</span></>} />
          <Live label="VOLUME" value={totals.volume.toLocaleString()} accent />
        </div>
      </div>

      <div className="wk-scroll scrl" ref={bodyRef}>
        {!hasExercises && (
          <div className="wk-empty">
            <div className="wk-empty-icon">🏋️</div>
            <div className="wk-empty-title">Start logging</div>
            <div className="wk-empty-sub">Add your first exercise, then log each set as you go.</div>
          </div>
        )}

        {workout.exercises.map((ex) => (
          <div key={ex.uid} className="wk-exercise">
            <div className="wk-ex-head">
              {ex.image
                ? <img src={ex.image} alt="" className="wk-ex-thumb" />
                : <div className="wk-ex-thumb placeholder">{ex.name[0]}</div>}
              <div className="wk-ex-meta">
                <div className="wk-ex-name">{ex.name}</div>
                <div className="wk-ex-target">
                  {ex.muscle || ex.target || 'Log your sets'}
                  {(historyFor(ex.name)?.best || ex.last) ? ` · last: ${historyFor(ex.name)?.best || ex.last}` : ''}
                </div>
              </div>
              <button className="wk-ex-remove" onClick={() => removeExercise(ex.uid)} aria-label="Remove exercise">✕</button>
            </div>

            <div className="wk-set-head">
              <span>SET</span>
              <span className="c">PREV</span>
              <span className="c">LB</span>
              <span className="c">REPS</span>
              <span />
            </div>

            {ex.sets.map((s, i) => (
              <div key={s.id} className={`wk-set${s.done ? ' done' : ''}`}>
                <button className="wk-set-n" onClick={() => removeSet(ex.uid, s.id)} title="Remove set">{i + 1}</button>
                <span className="wk-prev">{prevSetText(ex.name, i) || s.prev || '—'}</span>
                <input
                  className="wk-input" type="number" inputMode="numeric" value={s.lb} placeholder="—"
                  onChange={(e) => updateSet(ex.uid, s.id, 'lb', e.target.value === '' ? '' : Number(e.target.value))}
                />
                <input
                  className="wk-input" type="number" inputMode="numeric" value={s.reps} placeholder="—"
                  onChange={(e) => updateSet(ex.uid, s.id, 'reps', e.target.value === '' ? '' : Number(e.target.value))}
                />
                <button
                  className={`wk-check${s.done ? ' on' : ''}`}
                  onClick={() => toggleDone(ex.uid, s.id)}
                  aria-label={s.done ? 'Mark set incomplete' : 'Mark set complete'}
                >✓</button>
              </div>
            ))}

            <div className="wk-addset-wrap">
              <button className="wk-addset" onClick={() => addSet(ex.uid)}>+ Add set</button>
            </div>
          </div>
        ))}

        {suggestions.length > 0 && (
          <div className="wk-suggest">
            <div className="wk-suggest-head">Suggested next · goes with your session</div>
            <div className="wk-suggest-row scrl">
              {suggestions.map((ex) => (
                <button key={ex.id} className="wk-suggest-chip" onClick={() => addExercise(ex)}>
                  <span className="wk-suggest-info">
                    <span className="wk-suggest-name">{ex.name}</span>
                    <span className="wk-suggest-muscle">{ex.muscle}</span>
                  </span>
                  <span className="wk-suggest-plus">+</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick add: pick a muscle group → your past exercises for it */}
        <div className="wk-quickadd">
          <div className="wk-quickadd-head">Quick add by muscle</div>
          <div className="wk-group-row scrl">
            {MAJOR_GROUPS.map((g) => (
              <button
                key={g}
                className={'wk-group-chip' + (activeGroup === g ? ' on' : '')}
                onClick={() => setManualGroup(activeGroup === g ? '' : g)}
              >
                {g}
                {groupCounts[g] > 0 && <span className="wk-group-count">{groupCounts[g]}</span>}
              </button>
            ))}
          </div>
          {activeGroup && quickPicks.items.length > 0 && (
            <>
              {quickPicks.recommended && (
                <div className="wk-pop-hint">★ Popular {activeGroup.toLowerCase()} moves to start</div>
              )}
              <div className="wk-pop-row scrl">
                {quickPicks.items.map((p) => (
                  <button key={p.name} className="wk-pop-chip" onClick={() => addQuick(p)}>
                    <span className="wk-pop-name">{p.name}</span>
                    <span className="wk-pop-tail">
                      {!quickPicks.recommended && p.count > 1 ? <span className="wk-pop-count">{p.count}×</span> : null}
                      <span className="wk-pop-plus">+</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="wk-add-exercise" onClick={() => setPicking(true)}>
          + Add exercise
        </button>

        {hasExercises && (
          <button className="wk-discard" onClick={discard}>Discard workout</button>
        )}
      </div>

      <div className="wk-foot">
        <button className="btn-primary" disabled={!canFinish} onClick={finish}>
          {canFinish ? 'Finish workout ✓' : 'Log a set to finish'}
        </button>
      </div>

      {picking && (
        <Suspense fallback={
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 440, height: '88vh', background: 'var(--bg)', borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontWeight: 600 }}>
              Loading exercises…
            </div>
          </div>
        }>
          <ExercisePicker onAdd={addExercise} onClose={() => setPicking(false)} />
        </Suspense>
      )}
    </div>
  )
}

function Live({ label, value, accent }) {
  return (
    <div className="wk-live">
      <div className={`wk-live-v${accent ? ' accent' : ''}`}>{value}</div>
      <div className="wk-live-l">{label}</div>
    </div>
  )
}

function Summary({ workout, totals, elapsed, saveStatus, sweat, onClose }) {
  const saveText = {
    saving: '☁️ Saving to your history…',
    saved: '✓ Saved to your history',
    error: '⚠️ Couldn’t sync — check your connection',
    skipped: '',
    idle: '',
  }[saveStatus]

  return (
    <div className="wk-summary fadeup">
      <StatusBar />
      <div className="wk-sum-inner">
        <div className="wk-sum-emoji">🎉</div>
        <div className="wk-sum-kicker">SESSION COMPLETE</div>
        <h1 className="wk-sum-title">{workout.title}</h1>
        {workout.subtitle && <div className="wk-sum-sub">{workout.subtitle}</div>}
        <div className="wk-sum-grid">
          <div><div className="wk-sum-num">{elapsed}</div><div className="wk-sum-l">time</div></div>
          <div><div className="wk-sum-num">{totals.setsDone}</div><div className="wk-sum-l">sets</div></div>
          <div><div className="wk-sum-num accent">{totals.volume.toLocaleString()}</div><div className="wk-sum-l">lb volume</div></div>
        </div>

        {sweat && (
          <div className="wk-sweat">
            {sweat.leveledTo && <div className="wk-sweat-levelup">💧 LEVEL UP · Level {sweat.leveledTo}</div>}
            <div className="wk-sweat-earned">+{sweat.amount.toLocaleString()} <span>SWEAT</span></div>
            <div className="wk-sweat-breakdown">
              {sweat.breakdown.filter((b) => b.amount > 0).map((b) => (
                <div key={b.label} className="wk-sweat-line"><span>{b.label}</span><span>+{b.amount}</span></div>
              ))}
            </div>
          </div>
        )}

        {saveText && <div className={`wk-sum-save ${saveStatus}`}>{saveText}</div>}
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
