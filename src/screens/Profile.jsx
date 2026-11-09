import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { fromCm, kgToLb } from '../lib/profile.js'
import { levelFromTotal } from '../lib/sweat.js'
import './Profile.css'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const meta = user?.user_metadata || {}
  const p = profile || {}

  const displayName = p.display_name || meta.full_name || meta.name || 'Athlete'
  const avatarUrl = meta.avatar_url || meta.picture || null
  const initials = displayName.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'AF'
  const { level } = levelFromTotal(p.sweat || 0)
  const units = p.units || 'lb'

  const heightStr = p.height_cm
    ? (units === 'kg' ? `${Math.round(p.height_cm)} cm` : (() => { const h = fromCm(p.height_cm); return `${h.ft}' ${h.inch}"` })())
    : '—'
  const weightStr = p.weight_kg
    ? (units === 'kg' ? `${Math.round(p.weight_kg)} kg` : `${kgToLb(p.weight_kg)} lb`)
    : '—'

  const about = [
    ['Sex', p.sex], ['Age', p.age], ['Height', heightStr], ['Bodyweight', weightStr], ['Units', units],
  ]
  const training = [
    ['Goal', p.goal], ['Experience', p.experience],
    ['Training days', p.days_per_week ? `${p.days_per_week} / week` : null], ['Home gym', p.home_gym],
  ]
  const location = [['Gym', p.gym], ['City', p.city], ['State', p.state]]

  function handleSignOut() {
    if (window.confirm('Sign out of HugeAF?')) signOut()
  }

  return (
    <div className="page profile fadeup">
      <StatusBar />
      <div className="pf-bar">
        <button className="pf-back" onClick={() => navigate('/')}>‹</button>
        <span className="pf-bar-title">Profile</span>
        <button className="pf-edit-icon" onClick={() => navigate('/profile/edit')} aria-label="Edit">✎</button>
      </div>

      <div className="pf-hero">
        <span className="pf-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : initials}
        </span>
        <h1 className="pf-name">{displayName}</h1>
        {p.username && <div className="pf-username">@{p.username}</div>}
        <div className="pf-level">
          <span className="pf-level-badge">LVL {level}</span>
          <span className="pf-level-sweat">{(p.sweat || 0).toLocaleString()} Sweat 💧</span>
        </div>
      </div>

      <Section title="About you" rows={about} />
      <Section title="Training" rows={training} />
      <Section title="Location" rows={location} />

      <div className="pf-actions">
        <button className="pf-edit" onClick={() => navigate('/profile/edit')}>Edit profile</button>
        <button className="pf-signout" onClick={handleSignOut}>Sign out</button>
        <button className="pf-delete" onClick={() => navigate('/delete-account')}>Delete account &amp; data</button>
      </div>
    </div>
  )
}

function Section({ title, rows }) {
  const visible = rows.filter(([, v]) => v != null && v !== '')
  if (!visible.length) return null
  return (
    <div className="pf-section">
      <div className="pf-section-title">{title}</div>
      <div className="pf-card">
        {visible.map(([label, value]) => (
          <div key={label} className="pf-row">
            <span className="pf-row-label">{label}</span>
            <span className="pf-row-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
