import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { saveProfile, toCm, lbToKg } from '../lib/profile.js'
import { GYMS } from '../data/gyms.js'
import { STATES, GOALS, LEVELS } from '../data/profileOptions.js'
import './Onboarding.css'

function slugifyUsername(name, email) {
  const base = (name || email?.split('@')[0] || 'lifter').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return base.slice(0, 20)
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuth()
  const meta = user?.user_metadata || {}
  const fullName = meta.full_name || meta.name || ''
  const firstName = fullName.split(' ')[0] || 'there'
  const email = user?.email || meta.email || ''
  const avatarUrl = meta.avatar_url || meta.picture || null
  const initials = (fullName || 'AF').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const [step, setStep] = useState('welcome')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [form, setForm] = useState({
    display_name: fullName,
    username: slugifyUsername(fullName, email),
    sex: 'Male',
    age: '',
    units: 'lb',
    heightFt: '', heightIn: '', heightCm: '',
    weight: '',
    gym: '',
    city: '',
    state: '',
    goal: 'Build muscle',
    experience: 'Intermediate',
    days_per_week: 4,
    home_gym: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleFinish() {
    if (saving) return
    setSaving(true)
    const fields = {
      display_name: form.display_name.trim() || firstName,
      username: form.username.trim() || null,
      sex: form.sex,
      age: form.age ? Number(form.age) : null,
      units: form.units,
      height_cm: form.units === 'kg' ? Number(form.heightCm) || null : (form.heightFt || form.heightIn ? toCm(form.heightFt, form.heightIn) : null),
      weight_kg: form.weight ? (form.units === 'kg' ? Number(form.weight) : lbToKg(form.weight)) : null,
      gym: form.gym || null,
      city: form.city.trim() || null,
      state: form.state || null,
      goal: form.goal,
      experience: form.experience,
      days_per_week: form.days_per_week,
      home_gym: form.home_gym.trim() || form.gym || null,
      onboarded: true,
    }
    const { data, error } = await saveProfile(user?.id, fields)
    setSaving(false)
    if (error) {
      const msg = error.code === '23505' || /duplicate|unique/i.test(error.message)
        ? 'That username is taken — try another.'
        : error.message
      alert(msg)
      setStep('about')
      return
    }
    setSaved(data)
    setStep('complete')
  }

  function enterApp() {
    if (saved) setProfile(saved)
    navigate('/')
  }

  if (step === 'welcome') {
    return (
      <div className="ob welcome fadeup">
        <StatusBar />
        <div className="ob-pad">
          <div className="ob-signed">
            <span className="ob-avatar">{avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : initials}</span>
            <div>
              <div className="ob-signed-label">Signed in as</div>
              <div className="ob-signed-email">{email || 'your account'}</div>
            </div>
          </div>
          <h1 className="ob-welcome-title">Welcome to<br />the crew,<br /><span>{firstName}</span></h1>
          <p className="ob-welcome-sub">Here's what you get out of the box:</p>
          <div className="ob-features">
            <Feature icon="📊" title="Log sets & reps" sub="Track every workout and watch volume climb" />
            <Feature icon="📋" title="Follow programs" sub="PPL, 5/3/1, and more — or build your own" />
            <Feature icon="🔥" title="Join challenges" sub="Compete, build streaks, chase PRs" />
          </div>
          <div className="ob-spacer" />
          <button className="ob-primary" onClick={() => setStep('about')}>Set up my profile →</button>
        </div>
      </div>
    )
  }

  if (step === 'about') {
    return (
      <div className="ob fadeup">
        <StatusBar />
        <div className="ob-head">
          <div className="ob-head-row">
            <button className="ob-back" onClick={() => setStep('welcome')}>‹</button>
            <span className="ob-step">Step 1 of 2</span>
            <button className="ob-skip" onClick={() => setStep('training')}>Skip</button>
          </div>
          <div className="ob-progress"><span className="on" /><span /></div>
        </div>

        <div className="ob-scroll scrl">
          <h1 className="ob-title">About you</h1>
          <p className="ob-subtitle">This tailors your stats and recommendations.</p>

          <div className="ob-photo-row">
            <span className="ob-photo">{avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : initials}</span>
            <div>
              <div className="ob-photo-title">Profile photo</div>
              <div className="ob-photo-sub">Pulled from Google</div>
            </div>
          </div>

          <Field label="Display name">
            <input className="ob-input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="Your name" />
          </Field>

          <Field label="Username">
            <div className="ob-username">
              <span className="ob-at">@</span>
              <input className="ob-input bare" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" />
              {form.username.length >= 3 && <span className="ob-uname-check">✓</span>}
            </div>
          </Field>

          <Field label="Sex">
            <Segmented options={['Male', 'Female', 'Other']} value={form.sex} onChange={(v) => set('sex', v)} />
          </Field>

          <div className="ob-two">
            <Field label="Age">
              <input className="ob-input" type="number" inputMode="numeric" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="27" />
            </Field>
            <Field label="Units">
              <Segmented options={['lb', 'kg']} value={form.units} onChange={(v) => set('units', v)} />
            </Field>
          </div>

          <div className="ob-two">
            <Field label="Height">
              {form.units === 'kg' ? (
                <input className="ob-input" type="number" inputMode="numeric" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} placeholder="cm" />
              ) : (
                <div className="ob-height">
                  <input className="ob-input" type="number" inputMode="numeric" value={form.heightFt} onChange={(e) => set('heightFt', e.target.value)} placeholder="ft" />
                  <input className="ob-input" type="number" inputMode="numeric" value={form.heightIn} onChange={(e) => set('heightIn', e.target.value)} placeholder="in" />
                </div>
              )}
            </Field>
            <Field label="Bodyweight">
              <div className="ob-suffix-wrap">
                <input className="ob-input" type="number" inputMode="numeric" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="183" />
                <span className="ob-suffix">{form.units}</span>
              </div>
            </Field>
          </div>

          <Field label="Gym">
            <Select value={form.gym} onChange={(v) => set('gym', v)} placeholder="Select your gym" options={GYMS} />
          </Field>

          <div className="ob-two">
            <Field label="City" flex="1.6">
              <input className="ob-input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Frisco" />
            </Field>
            <Field label="State">
              <Select value={form.state} onChange={(v) => set('state', v)} placeholder="—" options={STATES} />
            </Field>
          </div>
        </div>

        <div className="ob-foot">
          <button className="ob-primary" onClick={() => setStep('training')}>Continue →</button>
        </div>
      </div>
    )
  }

  if (step === 'training') {
    return (
      <div className="ob fadeup">
        <StatusBar />
        <div className="ob-head">
          <div className="ob-head-row">
            <button className="ob-back" onClick={() => setStep('about')}>‹</button>
            <span className="ob-step">Step 2 of 2</span>
            <span style={{ width: 34 }} />
          </div>
          <div className="ob-progress"><span className="on" /><span className="on" /></div>
        </div>

        <div className="ob-scroll scrl">
          <h1 className="ob-title">Your training</h1>
          <p className="ob-subtitle">We'll recommend programs that fit.</p>

          <div className="ob-label">Primary goal</div>
          <div className="ob-goals">
            {GOALS.map((g) => (
              <button key={g.key} className={`ob-goal${form.goal === g.key ? ' on' : ''}`} onClick={() => set('goal', g.key)}>
                <span className="ob-goal-emoji">{g.emoji}</span>
                <span className="ob-goal-name">{g.key}</span>
              </button>
            ))}
          </div>

          <div className="ob-label">Experience level</div>
          <div className="ob-levels">
            {LEVELS.map((l) => (
              <button key={l.key} className={`ob-level${form.experience === l.key ? ' on' : ''}`} onClick={() => set('experience', l.key)}>
                <div>
                  <div className="ob-level-name">{l.key}</div>
                  <div className="ob-level-sub">{l.sub}</div>
                </div>
                <span className={`ob-radio${form.experience === l.key ? ' on' : ''}`}>{form.experience === l.key ? '✓' : ''}</span>
              </button>
            ))}
          </div>

          <div className="ob-days-head">
            <span className="ob-label" style={{ margin: 0 }}>Training days / week</span>
            <span className="ob-days-val">{form.days_per_week} days</span>
          </div>
          <div className="ob-days">
            {[2, 3, 4, 5, 6].map((d) => (
              <button key={d} className={`ob-day${form.days_per_week === d ? ' on' : ''}`} onClick={() => set('days_per_week', d)}>{d}</button>
            ))}
          </div>

          <Field label="Home gym">
            <input className="ob-input" value={form.home_gym} onChange={(e) => set('home_gym', e.target.value)} placeholder={form.gym || 'Your main gym'} />
          </Field>
        </div>

        <div className="ob-foot">
          <button className="ob-primary" onClick={handleFinish} disabled={saving}>{saving ? 'Saving…' : 'Finish setup →'}</button>
        </div>
      </div>
    )
  }

  // complete
  return (
    <div className="ob complete fadeup">
      <StatusBar />
      <div className="ob-complete-glow" />
      <div className="ob-complete-inner">
        <div className="ob-check">✓</div>
        <h1 className="ob-complete-title">You're all set,<br />{firstName}</h1>
        <p className="ob-complete-sub">Your profile is saved. Log your first session whenever you're ready.</p>
        <div className="ob-chips">
          <span className="ob-chip">{GOALS.find((g) => g.key === form.goal)?.emoji} {form.goal}</span>
          <span className="ob-chip">{form.experience}</span>
          <span className="ob-chip">{form.days_per_week} days / wk</span>
        </div>
      </div>
      <div className="ob-complete-foot">
        <button className="ob-primary" onClick={enterApp}>Enter HugeAF →</button>
      </div>
    </div>
  )
}

function Feature({ icon, title, sub }) {
  return (
    <div className="ob-feature">
      <span className="ob-feature-icon">{icon}</span>
      <div>
        <div className="ob-feature-title">{title}</div>
        <div className="ob-feature-sub">{sub}</div>
      </div>
    </div>
  )
}

function Field({ label, children, flex }) {
  return (
    <div className="ob-field" style={flex ? { flex } : undefined}>
      <div className="ob-field-label">{label}</div>
      {children}
    </div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="ob-seg">
      {options.map((o) => (
        <button key={o} className={`ob-seg-item${value === o ? ' on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="ob-select-wrap">
      <select className={`ob-select${value ? '' : ' empty'}`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="ob-select-caret">⌄</span>
    </div>
  )
}
