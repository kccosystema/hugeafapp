import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import SweatBar from '../components/SweatBar.jsx'
import { fetchWorkoutHistory } from '../lib/workouts.js'
import { computeStreak, totalVolume, formatK, localDateKey } from '../lib/stats.js'
import { useAuth } from '../lib/auth.jsx'
import './Progress.css'

export default function Progress() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', data: [], error: null })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, status: 'loading' }))
    fetchWorkoutHistory(user?.id).then(({ data, error }) => {
      if (!alive) return
      setState({ status: error ? 'error' : 'ready', data: data || [], error })
    })
    return () => { alive = false }
  }, [user?.id])

  const { data, status } = state
  const summary = useMemo(() => computeSummary(data), [data])
  const chart = useMemo(() => data.slice(0, 10).reverse(), [data])
  const chartMax = Math.max(1, ...chart.map((w) => w.total_volume))

  return (
    <div className="page progress fadeup">
      <StatusBar />
      <SweatBar />
      <header className="prog-head">
        <h1 className="prog-title">Progress</h1>
        <p className="prog-sub">Your training history, synced to your account.</p>
      </header>

      {status === 'loading' && <div className="prog-msg">Loading your history…</div>}

      {status === 'error' && (
        <div className="prog-msg error">Couldn’t load history — check your connection.</div>
      )}

      {status === 'ready' && data.length === 0 && (
        <div className="prog-empty">
          <div className="prog-empty-icon">📈</div>
          <div className="prog-empty-title">No workouts yet</div>
          <div className="prog-empty-sub">Finish your first session and it’ll show up here — with your volume, streak and full history.</div>
          <button className="btn-primary prog-empty-cta" onClick={() => navigate('/workout')}>Start a workout →</button>
        </div>
      )}

      {status === 'ready' && data.length > 0 && (
        <>
          {/* summary cards */}
          <div className="prog-stats">
            <div className="prog-stat">
              <div className="prog-stat-num">{summary.count}</div>
              <div className="prog-stat-label">workouts</div>
            </div>
            <div className="prog-stat">
              <div className="prog-stat-num accent">{formatK(summary.volume)}</div>
              <div className="prog-stat-label">lb total volume</div>
            </div>
            <div className="prog-stat">
              <div className="prog-stat-num">{summary.streak} <span>🔥</span></div>
              <div className="prog-stat-label">day streak</div>
            </div>
          </div>

          {/* volume bar chart */}
          <div className="prog-card">
            <div className="prog-card-head">
              <span className="prog-card-title">Volume · last {chart.length}</span>
              <span className="prog-card-note">lb per session</span>
            </div>
            <div className="prog-chart">
              {chart.map((w) => (
                <div key={w.id} className="prog-bar-col" title={`${w.total_volume.toLocaleString()} lb`}>
                  <div className="prog-bar-track">
                    <div
                      className="prog-bar-fill"
                      style={{ height: `${Math.max(6, (w.total_volume / chartMax) * 100)}%` }}
                    />
                  </div>
                  <div className="prog-bar-label">{shortDay(w.finished_at)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* history list */}
          <div className="section-head"><span className="section-title">History</span></div>
          <div className="prog-list">
            {data.map((w) => (
              <div key={w.id} className="prog-item">
                <div className="prog-item-date">
                  <div className="prog-item-day">{relDay(w.finished_at)}</div>
                  <div className="prog-item-time">{clockTime(w.finished_at)}</div>
                </div>
                <div className="prog-item-meta">
                  <div className="prog-item-title">{w.title}{w.subtitle ? ` · ${w.subtitle}` : ''}</div>
                  <div className="prog-item-chips">
                    <span>{formatDuration(w.duration_sec)}</span>
                    <span>{w.total_sets} sets</span>
                    <span className="accent">{w.total_volume.toLocaleString()} lb</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---- helpers ----
function computeSummary(rows) {
  return { count: rows.length, volume: totalVolume(rows), streak: computeStreak(rows) }
}

function formatDuration(sec) {
  const m = Math.round((sec || 0) / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function relDay(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(); yest.setDate(today.getDate() - 1)
  if (localDateKey(d) === localDateKey(today)) return 'Today'
  if (localDateKey(d) === localDateKey(yest)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function shortDay(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
}

function clockTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
