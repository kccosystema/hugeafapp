import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import SweatBar from '../components/SweatBar.jsx'
import { supplements } from '../data/workout.js'
import { majorGroup, videoPicks, resolveMuscle } from '../lib/suggest.js'

// Pull the 11-char YouTube id from a video URL (for thumbnails).
function youtubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)
  return m ? m[1] : null
}
import { fetchArticles } from '../lib/blog.js'
import { fetchGuides } from '../lib/formGuides.js'
import { getActiveWorkout } from '../lib/workoutStore.js'
import { fetchWorkoutHistory, fetchWeekdayTopExercises, fetchExerciseCounts } from '../lib/workouts.js'
import { fetchFollowed } from '../lib/programs.js'
import { getProgram } from '../data/programs.js'
import { fetchJoined, computeProgress, daysLeft } from '../lib/challenges.js'
import { fetchChallenges, getChallengeCached } from '../lib/challenges.js'
import { computeStreak, volumeThisWeek, totalVolume, totalSets, avgDuration, formatK, formatDuration } from '../lib/stats.js'
import { fetchRatings, computeStats, overallScore } from '../lib/gymCandy.js'
import { useAuth } from '../lib/auth.jsx'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [active, setActive] = useState(null)
  const [history, setHistory] = useState(null)
  const [followed, setFollowed] = useState(null)
  const [joinedCh, setJoinedCh] = useState(null)
  const [blogArticles, setBlogArticles] = useState([])
  const [guides, setGuides] = useState([])
  const [ratings, setRatings] = useState([])
  const [onDayExercises, setOnDayExercises] = useState([])
  const [topEx, setTopEx] = useState([])
  const [exTotal, setExTotal] = useState(0)
  const [exGroups, setExGroups] = useState({})
  const [exList, setExList] = useState([])

  useEffect(() => { setActive(getActiveWorkout()) }, [])

  // Real exercise catalog counts (total + per major group) for "Browse exercises".
  useEffect(() => {
    let alive = true
    import('../lib/exerciseRepo.js').then(({ loadExercises }) => {
      const apply = (list) => {
        if (!alive || !Array.isArray(list)) return
        const g = {}
        for (const e of list) { const mg = majorGroup(e.muscle); if (mg) g[mg] = (g[mg] || 0) + 1 }
        setExGroups(g)
        setExTotal(list.length)
        setExList(list)
      }
      apply(loadExercises(user?.id, apply))
    })
    return () => { alive = false }
  }, [user?.id])
  useEffect(() => { fetchArticles().then(setBlogArticles) }, [])
  useEffect(() => { fetchGuides().then(setGuides) }, [])
  useEffect(() => {
    let alive = true
    fetchRatings(user?.id).then(({ data }) => { if (alive) setRatings(data || []) })
    fetchWeekdayTopExercises(user?.id, 3).then((e) => { if (alive) setOnDayExercises(e) })
    fetchExerciseCounts(user?.id).then((c) => { if (alive) setTopEx(c) })
    return () => { alive = false }
  }, [user?.id])

  useEffect(() => {
    let alive = true
    fetchWorkoutHistory(user?.id).then(({ data }) => { if (alive) setHistory(data || []) })
    fetchFollowed(user?.id).then(({ data }) => {
      if (!alive) return
      setFollowed((data || []).map((f) => ({ ...f, program: getProgram(f.program_id) })).filter((f) => f.program))
    })
    Promise.all([fetchChallenges(), fetchJoined(user?.id)]).then(([, { data }]) => {
      if (!alive) return
      setJoinedCh((data || []).map((j) => ({ row: j, challenge: getChallengeCached(j.challenge_id) })).filter((x) => x.challenge))
    })
    return () => { alive = false }
  }, [user?.id])

  const loaded = history !== null
  const rows = history || []
  const streak = computeStreak(rows)
  const weekVolume = volumeThisWeek(rows)
  const workoutCount = rows.length
  const lifetimeVolume = totalVolume(rows)
  const lifetimeSets = totalSets(rows)
  const avgSession = avgDuration(rows)
  const videoExercises = useMemo(() => videoPicks(exList, 12), [exList])

  // The user's go-to movements — most-logged exercises across their history.
  const suggestedEx = useMemo(() => topEx.slice(0, 5).map((e) => ({
    name: e.name,
    exerciseId: e.exerciseId,
    muscle: resolveMuscle(e, exList) || e.muscle || null,
    count: e.count,
  })), [topEx, exList])

  const gcStats = useMemo(() => computeStats(ratings), [ratings])
  const todayDow = new Date().getDay()
  const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayDow]
  const onDayGC = useMemo(() => ratings
    .filter((r) => new Date(`${r.rated_on}T00:00:00`).getDay() === todayDow)
    .map((r) => ({ ...r, score: overallScore(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3), [ratings, todayDow])
  const showOnDay = onDayExercises.length > 0 || onDayGC.length > 0

  const meta = user?.user_metadata || {}
  const displayName = meta.full_name || meta.name || user?.email || 'Athlete'
  const avatarUrl = meta.avatar_url || meta.picture || null
  const initials = displayName
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'AF'

  const activeSets = active
    ? active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    : 0

  return (
    <div className="page home fadeup">
      <StatusBar />

      {/* Sweat meter */}
      <SweatBar />

      {/* top bar */}
      <header className="home-top">
        <div className="logo">HUGE<span>AF</span></div>
        <div className="home-actions">
          <button className="icon-btn" onClick={() => navigate('/gym-candy')} aria-label="Gym Candy">🍬</button>
          <button className="icon-btn" aria-label="Notifications">
            🔔<span className="dot" />
          </button>
          <button className="avatar" onClick={() => navigate('/profile')} aria-label="Account">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
              : initials}
          </button>
        </div>
      </header>

      {/* search */}
      <button className="search">
        <span className="search-icon">⌕</span>
        Search exercises, programs, blogs
      </button>

      {/* resume in-progress workout */}
      {active && (
        <button className="resume-bar" onClick={() => navigate('/workout')}>
          <span className="resume-pulse" />
          <div className="resume-meta">
            <div className="resume-title">Workout in progress</div>
            <div className="resume-sub">
              {active.exercises.length} exercise{active.exercises.length !== 1 ? 's' : ''}
              {activeSets > 0 ? ` · ${activeSets} set${activeSets !== 1 ? 's' : ''} logged` : ''}
            </div>
          </div>
          <span className="resume-cta">Resume →</span>
        </button>
      )}

      {/* workout metrics — above today's session */}
      <div className="stats">
        <div className="stat">
          <div className="stat-num">{loaded ? streak : '–'} <span>🔥</span></div>
          <div className="stat-label">day streak</div>
        </div>
        <div className="stat wide">
          <div className="stat-num">{loaded ? weekVolume.toLocaleString() : '–'}<span className="unit"> lb</span></div>
          <div className="stat-label">volume this week</div>
        </div>
        <div className="stat">
          <div className="stat-num accent">{loaded ? workoutCount : '–'}</div>
          <div className="stat-label">workouts</div>
        </div>
      </div>

      {/* lifetime workout stats */}
      <div className="stats" style={{ paddingTop: 10 }}>
        <div className="stat">
          <div className="stat-num">{loaded ? formatK(lifetimeVolume) : '–'}<span className="unit"> lb</span></div>
          <div className="stat-label">total volume</div>
        </div>
        <div className="stat">
          <div className="stat-num">{loaded ? lifetimeSets.toLocaleString() : '–'}</div>
          <div className="stat-label">total sets</div>
        </div>
        <div className="stat">
          <div className="stat-num">{loaded ? formatDuration(avgSession) : '–'}</div>
          <div className="stat-label">avg session</div>
        </div>
      </div>

      {/* on this day — what you usually train this weekday */}
      {showOnDay && (
        <div className="onday">
          <div className="onday-head">★ On {weekdayName}s</div>
          <div className="onday-grid">
            <div className="onday-col">
              <div className="onday-label">Top exercises</div>
              {onDayExercises.length > 0 ? onDayExercises.map((e) => (
                <button
                  key={e.name}
                  className="onday-row"
                  onClick={() => navigate(e.exerciseId ? `/exercises/${e.exerciseId}` : '/exercises')}
                >
                  <span className="onday-name">{e.name}</span>
                  <span className="onday-badge">{e.count}×</span>
                </button>
              )) : <div className="onday-empty">No {weekdayName} workouts yet</div>}
            </div>
            <div className="onday-col">
              <div className="onday-label">Top Gym Candy</div>
              {onDayGC.length > 0 ? onDayGC.map((r) => (
                <button key={r.id} className="onday-row" onClick={() => navigate('/gym-candy')}>
                  <span className="onday-name">{r.exercise_name || 'Session'}</span>
                  <span className="onday-badge accent">{r.score}</span>
                </button>
              )) : <div className="onday-empty">No {weekdayName} ratings yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* suggested exercises — your go-to moves, from your history */}
      {suggestedEx.length > 0 ? (
        <section className="suggest-card">
          <div className="suggest-head">
            <div>
              <div className="suggest-kicker">★ Suggested for you</div>
              <h1 className="suggest-title">Your go-to moves</h1>
            </div>
          </div>
          <div className="suggest-list">
            {suggestedEx.map((e, i) => (
              <button
                key={e.name}
                className="suggest-row"
                onClick={() => navigate(e.exerciseId ? `/exercises/${e.exerciseId}` : '/exercises')}
              >
                <span className="suggest-rank">{i + 1}</span>
                <span className="suggest-info">
                  <span className="suggest-name">{e.name}</span>
                  {e.muscle && <span className="suggest-muscle">{e.muscle}</span>}
                </span>
                <span className="suggest-count">{e.count}×</span>
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/workout', { state: { seed: suggestedEx } })}
          >
            Start workout →
          </button>
        </section>
      ) : (
        <div className="px" style={{ marginTop: 16 }}>
          <button className="suggest-empty" onClick={() => navigate('/workout', { state: { fresh: true } })}>
            <span className="suggest-empty-emoji">🏋️</span>
            <span className="suggest-empty-meta">
              <span className="suggest-empty-title">Start your first workout</span>
              <span className="suggest-empty-sub">Log a session and your go-to moves show up here</span>
            </span>
            <span className="suggest-empty-arrow">→</span>
          </button>
        </div>
      )}

      {/* gym candy */}
      {gcStats && gcStats.total > 0 ? (
        <>
          <SectionHead title="Gym Candy" onLink={() => navigate('/gym-candy')} link="Open →" />
          <div className="stats" style={{ paddingTop: 0 }}>
            <div className="stat" onClick={() => navigate('/gym-candy')} style={{ cursor: 'pointer' }}>
              <div className="stat-num">{gcStats.total}</div>
              <div className="stat-label">ratings</div>
            </div>
            <div className="stat" onClick={() => navigate('/gym-candy')} style={{ cursor: 'pointer' }}>
              <div className="stat-num accent">{gcStats.avgOverall}<span className="unit"> /100</span></div>
              <div className="stat-label">avg score</div>
            </div>
            <div className="stat" onClick={() => navigate('/gym-candy')} style={{ cursor: 'pointer' }}>
              <div className="stat-num">{gcStats.best}<span className="unit"> /100</span></div>
              <div className="stat-label">best score</div>
            </div>
          </div>
        </>
      ) : (
        <div className="px" style={{ marginTop: 16 }}>
          <button className="gymcandy-promo" onClick={() => navigate('/gym-candy')}>
            <span className="gymcandy-emoji">🍬</span>
            <span className="gymcandy-meta">
              <span className="gymcandy-title">Gym Candy</span>
              <span className="gymcandy-sub">Rate your form, effort &amp; physique</span>
            </span>
            <span className="gymcandy-arrow">→</span>
          </button>
        </div>
      )}

      {/* continue training */}
      <SectionHead title="Continue training" onLink={() => navigate('/programs')} link="See all" />
      {followed && followed.length > 0 ? (
        <div className="row-scroll scrl">
          {followed.map(({ program, current_week }) => {
            const pct = Math.min(100, Math.round((current_week / program.weeks) * 100))
            return (
              <article key={program.id} className="program-card" onClick={() => navigate(`/programs/${program.id}`)}>
                <div className="program-media">
                  <img src={program.image} alt={program.name} />
                  <span className="program-tag">{program.daysPerWeek} DAYS / WK</span>
                </div>
                <div className="program-body">
                  <div className="program-title">{program.name}</div>
                  <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  <div className="program-meta">Week {current_week} of {program.weeks} · {pct}%</div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="px">
          <button className="program-empty" onClick={() => navigate('/programs')}>
            <div className="program-empty-title">No active program</div>
            <div className="program-empty-sub">Follow a program to get a structured plan → </div>
          </button>
        </div>
      )}

      {/* active challenges */}
      <SectionHead title="Active challenges" link="See all" onLink={() => navigate('/challenges')} />
      {joinedCh && joinedCh.length > 0 ? (
        <div className="row-scroll scrl">
          {joinedCh.map(({ row, challenge }) => {
            const p = computeProgress(challenge, row, rows)
            return (
              <article key={challenge.id} className="challenge-card" onClick={() => navigate(`/challenges/${challenge.id}`)}>
                <img src={challenge.image} alt="" />
                <div className="challenge-scrim" />
                <span className="challenge-tag">{p.done ? '✓ DONE' : `${p.pct}%`}</span>
                <div className="challenge-body">
                  <div className="challenge-title">{challenge.title}</div>
                  <div className="challenge-sub">{p.value}/{p.goal} {challenge.unit} · {daysLeft(challenge, row)}d left</div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="px">
          <button className="program-empty" onClick={() => navigate('/challenges')}>
            <div className="program-empty-title">No active challenges</div>
            <div className="program-empty-sub">Join a challenge and start competing → </div>
          </button>
        </div>
      )}

      {/* browse exercises */}
      <SectionHead
        title="Browse exercises"
        link={exTotal ? `All ${exTotal.toLocaleString()}` : 'See all'}
        onLink={() => navigate('/exercises')}
      />
      <div className="row-scroll scrl">
        {['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'].map((name) => (
          <button key={name} className="muscle-card" onClick={() => navigate('/exercises')}>
            <div className="muscle-count">{exGroups[name] != null ? exGroups[name].toLocaleString() : '–'}</div>
            <div className="muscle-name">{name}</div>
            <div className="muscle-sub">exercises</div>
          </button>
        ))}
      </div>

      {/* exercise video cards — swipeable */}
      {videoExercises.length > 0 && (
        <>
          <SectionHead title="Exercise videos" link="See all" onLink={() => navigate('/exercises')} />
          <div className="row-scroll scrl">
            {videoExercises.map((ex) => {
              const vid = youtubeId(ex.video)
              return (
                <button key={ex.id} className="video-card" onClick={() => navigate(`/exercises/${ex.id}`)}>
                  <div className="video-thumb">
                    <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt="" loading="lazy" />
                    <span className="video-play">▶</span>
                  </div>
                  <div className="video-meta">
                    <div className="video-name">{ex.name}</div>
                    <div className="video-muscle">{ex.muscle}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* form guides */}
      {guides.length > 0 && (
        <>
          <SectionHead title="Form guides" link="See all" onLink={() => navigate('/guides')} />
          <div className="px">
            <article className="guide-card" onClick={() => navigate(`/guides/${guides[0].id}`)}>
              <div className="guide-media">
                <img src={guides[0].image} alt={guides[0].title} />
                <div className="guide-scrim" />
                <span className="guide-tag">FEATURED GUIDE</span>
              </div>
              <div className="guide-body">
                <div className="guide-title">{guides[0].title}</div>
                <div className="guide-sub">{guides[0].category}</div>
              </div>
            </article>
          </div>
        </>
      )}

      {/* blog */}
      <SectionHead title="From the blog" link="See all" onLink={() => navigate('/blog')} />
      <div className="px blog-list">
        {blogArticles.slice(0, 2).map((b) => (
          <article key={b.id} className="blog-card" onClick={() => navigate(`/blog/${b.id}`)}>
            <img src={b.image} alt="" />
            <div>
              <span className="blog-tag">{b.category.toUpperCase()}</span>
              <div className="blog-title">{b.title}</div>
              <div className="blog-meta">{b.readMin} min read</div>
            </div>
          </article>
        ))}
      </div>

      {/* supplements */}
      <div className="px supplement-head">
        <span className="section-title">Supplement directory</span>
      </div>
      <div className="px pills">
        {supplements.map((s) => (
          <span key={s} className="pill" onClick={() => navigate('/supplements')}>{s}</span>
        ))}
        <span className="pill pill-solid" onClick={() => navigate('/supplements')}>Browse all →</span>
      </div>
    </div>
  )
}

function SectionHead({ title, link, onLink }) {
  return (
    <div className="section-head">
      <span className="section-title">{title}</span>
      {link && <button className="section-link" onClick={onLink}>{link}</button>}
    </div>
  )
}
