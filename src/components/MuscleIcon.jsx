import { cloneElement } from 'react'
import { muscleMeta } from '../data/exercises.js'

// A simplified front-body pictogram. The muscle region for a group is drawn
// full-strength; the rest of the body is faint so it always reads as a figure.
const PARTS = [
  ['head', <circle cx="12" cy="3.2" r="1.7" />],
  ['traps', <rect x="10" y="4.5" width="4" height="2" rx="1" />],
  ['deltL', <circle cx="7.7" cy="7.9" r="1.7" />],
  ['deltR', <circle cx="16.3" cy="7.9" r="1.7" />],
  ['chest', <rect x="8.5" y="7.1" width="7" height="3.1" rx="1.4" />],
  ['abs', <rect x="9.6" y="10.6" width="4.8" height="4.7" rx="1.3" />],
  ['armL', <rect x="5.4" y="7.6" width="1.9" height="5.3" rx="0.95" />],
  ['armR', <rect x="16.7" y="7.6" width="1.9" height="5.3" rx="0.95" />],
  ['foreL', <rect x="5.1" y="13" width="1.7" height="4.9" rx="0.85" />],
  ['foreR', <rect x="17.2" y="13" width="1.7" height="4.9" rx="0.85" />],
  ['thighL', <rect x="9" y="15.4" width="2.4" height="5.3" rx="1.2" />],
  ['thighR', <rect x="12.6" y="15.4" width="2.4" height="5.3" rx="1.2" />],
  ['calfL', <rect x="9.3" y="20.3" width="2" height="3" rx="1" />],
  ['calfR', <rect x="12.7" y="20.3" width="2" height="3" rx="1" />],
]

const ACTIVE = {
  chest: ['chest'],
  back: ['traps', 'deltL', 'deltR'],
  shoulders: ['deltL', 'deltR'],
  traps: ['traps'],
  arms: ['armL', 'armR'],
  forearms: ['foreL', 'foreR'],
  abs: ['abs'],
  legs: ['thighL', 'thighR'],
  calves: ['calfL', 'calfR'],
  body: [],
}

export default function MuscleIcon({ muscle, size = 26 }) {
  const { key, color } = muscleMeta(muscle)

  if (key === 'custom') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ color }} fill="currentColor" aria-hidden="true">
        <path d="M12 2.5l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" />
      </svg>
    )
  }

  const active = ACTIVE[key] || []
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color }} fill="currentColor" aria-hidden="true">
      {PARTS.map(([id, el]) =>
        cloneElement(el, {
          key: id,
          opacity: id === 'head' ? 0.5 : active.includes(id) ? 1 : 0.2,
        })
      )}
    </svg>
  )
}
