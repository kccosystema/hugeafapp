import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { levelFromTotal, takeSweatSplash } from '../lib/sweat.js'
import './SweatBar.css'

// The "Sweat" meter — an animated water bar that pours into a bucket.
// Fills from 0 → current % on mount so it reads as water rising.
export default function SweatBar() {
  const { profile } = useAuth()
  const total = profile?.sweat || 0
  const { level, into, bucketSize, pct } = levelFromTotal(total)

  const [fill, setFill] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setFill(pct), 120)
    return () => clearTimeout(t)
  }, [pct])

  // "+N SWEAT" splash when arriving right after a workout
  const [splash, setSplash] = useState(null)
  useEffect(() => {
    const gain = takeSweatSplash()
    if (!gain) return
    setSplash(gain)
    const t = setTimeout(() => setSplash(null), 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`sweat${splash != null ? ' sweat-gain' : ''}`} aria-label={`Sweat level ${level}, ${into} of ${bucketSize}`}>
      {splash != null && <div className="sweat-splash">+{splash.toLocaleString()} 💧</div>}
      <div className="sweat-lvl"><b>{level}</b><small>LVL</small></div>

      <div className="sweat-track">
        <div className="sweat-fill" style={{ width: `${fill}%` }}>
          <span className="sweat-bub b1" /><span className="sweat-bub b2" /><span className="sweat-bub b3" />
        </div>
        <div className="sweat-label">{into.toLocaleString()} / {bucketSize.toLocaleString()} <span>SWEAT</span></div>
      </div>

      <div className="sweat-bucket" aria-hidden="true">
        <svg viewBox="0 0 44 46" width="34" height="36">
          <defs>
            <clipPath id="sweatBucket"><path d="M8 14 h28 l-3 27 a3 3 0 0 1-3 2.6 H14 a3 3 0 0 1-3-2.6 z" /></clipPath>
            <linearGradient id="sweatWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#0ea5c4" />
            </linearGradient>
          </defs>
          <g clipPath="url(#sweatBucket)">
            <rect className="sweat-bwater" x="4" y={44 - (0.16 + (pct / 100) * 0.6) * 32} width="36" height="40" fill="url(#sweatWater)" />
          </g>
          <path d="M8 14 h28 l-3 27 a3 3 0 0 1-3 2.6 H14 a3 3 0 0 1-3-2.6 z" fill="none" stroke="#c7d2dd" strokeWidth="2" />
          <rect x="6" y="10" width="32" height="5" rx="2.5" fill="#e2e8f0" />
          <path d="M11 12 Q22 2 33 12" fill="none" stroke="#c7d2dd" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}
