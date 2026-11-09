import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { saveProfile, toCm, fromCm, lbToKg, kgToLb } from '../lib/profile.js'
import { GYMS } from '../data/gyms.js'
import { STATES, GOALS, LEVELS } from '../data/profileOptions.js'
import './Onboarding.css'
import './ProfileEdit.css'

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const p = profile || {}
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(() => {
    const units = p.units || 'lb'
    const h = p.height_cm ? fromCm(p.height_cm) : { ft: '', inch: '' }
    return {
      display_name: p.display_name || '', username: p.username || '', sex: p.sex || 'Male',
      age: p.age || '', units,
      heightFt: h.ft || '', heightIn: h.inch || '', heightCm: p.height_cm ? Math.round(p.height_cm) : '',
      weight: p.weight_kg ? (units === 'kg' ? Math.round(p.weight_kg) : kgToLb(p.weight_kg)) : '',
      gym: p.gym || '', city: p.city || '', state: p.state || '',
      goal: p.goal || 'Build muscle', experience: p.experience || 'Intermediate',
      days_per_week: p.days_per_week || 4, home_gym: p.home_gym || '',
    }
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSave() {
    if (saving) return
    setSaving(true)
    const fields = {
      display_name: form.display_name.trim() || null,
      username: form.username.trim() || null,
      sex: form.sex,
      age: form.age ? Number(form.age) : null,
      units: form.units,
      height_cm: form.units === 'kg' ? (form.heightCm ? Number(form.heightCm) : null) : ((form.heightFt || form.heightIn) ? toCm(form.heightFt, form.heightIn) : null),
      weight_kg: form.weight ? (form.units === 'kg' ? Number(form.weight) : lbToKg(form.weight)) : null,
      gym: form.gym || null, city: form.city.trim() || null, state: form.state || null,
      goal: form.goal, experience: form.experience, days_per_week: form.days_per_week,
      home_gym: form.home_gym.trim() || form.gym || null,
      onboarded: true,
    }
    const { data, error } = await saveProfile(user?.id, fields)
    setSaving(false)
    if (error) {
      const msg = error.code === '23505' || /duplicate|unique/i.test(error.message) ? 'That username is taken — try another.' : error.message
      return alert(msg)
    }
    if (data) setProfile(data)
    navigate('/profile')
  }

  return (
    <div className="ob">
      <StatusBar />
      <div className="ob-head">
        <div className="ob-head-row">
          <button className="ob-back" onClick={() => navigate('/profile')}>‹</button>
          <span className="ob-step">Edit profile</span>
          <span style={{ width: 34 }} />
        </div>
      </div>

      <div className="ob-scroll scrl">
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
        <button className="ob-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
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
