import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import RangeSlider from '../components/RangeSlider.jsx'
import MuscleIcon from '../components/MuscleIcon.jsx'
import { GYMS } from '../data/gyms.js'
import { saveRating, fetchRatings, overallScore } from '../lib/gymCandy.js'
import { fromCm, toCm, kgToLb, lbToKg } from '../lib/profile.js'
import { useAuth } from '../lib/auth.jsx'
import './GymCandyForm.css'

const BODY = [
  { key: 'arms', label: 'Arms', muscle: 'Biceps' },
  { key: 'chest', label: 'Chest', muscle: 'Chest' },
  { key: 'back', label: 'Back', muscle: 'Back' },
  { key: 'glutes', label: 'Glutes', muscle: 'Glutes' },
  { key: 'legs', label: 'Legs', muscle: 'Quadriceps' },
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function GymCandyForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { user, profile } = useAuth()
  const editing = !!id
  // "Dupe": the new-rating route was opened with a source row to copy from.
  const duping = !editing && !!location.state?.rating
  const units = profile?.units || 'lb'

  const initialHeight = profile?.height_cm ? fromCm(profile.height_cm) : { ft: '', inch: '' }
  const [form, setForm] = useState({
    rated_on: todayStr(),
    gym: profile?.gym || '',
    exercise_name: '',
    outfit: '',
    stance: 50, form: 50, effort: 50,
    arms: 50, chest: 50, back: 50, glutes: 50, legs: 50,
    heightFt: initialHeight.ft || '', heightIn: initialHeight.inch || '',
    heightCm: profile?.height_cm ? Math.round(profile.height_cm) : '',
    weight: profile?.weight_kg ? (units === 'kg' ? Math.round(profile.weight_kg) : kgToLb(profile.weight_kg)) : '',
    notes: '',
  })
  const [showSelf, setShowSelf] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Load the row when editing (from nav state, else fetch), or copy it when duping.
  useEffect(() => {
    if (!editing && !duping) return
    // keepDate: an edit keeps the original date; a dupe is a new entry → today.
    const apply = (r, keepDate = true) => {
      const h = r.height_cm ? fromCm(r.height_cm) : { ft: '', inch: '' }
      setForm((f) => ({
        ...f,
        rated_on: keepDate ? (r.rated_on || f.rated_on) : todayStr(),
        gym: r.gym || '', exercise_name: r.exercise_name || '', outfit: r.outfit || '',
        stance: r.stance ?? 50, form: r.form ?? 50, effort: r.effort ?? 50,
        arms: r.arms ?? 50, chest: r.chest ?? 50, back: r.back ?? 50, glutes: r.glutes ?? 50, legs: r.legs ?? 50,
        heightFt: h.ft || '', heightIn: h.inch || '', heightCm: r.height_cm ? Math.round(r.height_cm) : '',
        weight: r.weight_kg ? (units === 'kg' ? Math.round(r.weight_kg) : kgToLb(r.weight_kg)) : '',
        notes: r.notes || '',
      }))
      if (r.arms != null || r.notes) setShowSelf(true)
    }
    if (duping) apply(location.state.rating, false)
    else if (location.state?.rating) apply(location.state.rating)
    else fetchRatings(user?.id).then(({ data }) => { const r = data.find((x) => x.id === id); if (r) apply(r) })
  }, [editing, duping, id])

  const overall = useMemo(() => overallScore(form), [form.stance, form.form, form.effort])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    const height_cm = units === 'kg'
      ? (form.heightCm ? Number(form.heightCm) : null)
      : ((form.heightFt || form.heightIn) ? toCm(form.heightFt, form.heightIn) : null)
    const weight_kg = form.weight ? (units === 'kg' ? Number(form.weight) : lbToKg(form.weight)) : null
    const fields = {
      rated_on: form.rated_on,
      gym: form.gym || null,
      exercise_name: form.exercise_name.trim() || null,
      outfit: form.outfit.trim() || null,
      stance: form.stance, form: form.form, effort: form.effort,
      arms: form.arms, chest: form.chest, back: form.back, glutes: form.glutes, legs: form.legs,
      height_cm, weight_kg,
      notes: form.notes.trim() || null,
    }
    const { error } = await saveRating(user?.id, fields, editing ? id : undefined)
    setSaving(false)
    if (error) return alert(error.message)
    navigate('/gym-candy')
  }

  return (
    <div className="gcf">
      <StatusBar />
      <div className="gcf-head">
        <span className="gcf-head-spacer" />
        <div className="gcf-title">{editing ? 'Edit Gym Rating' : duping ? 'Duplicate Rating' : 'Add New Gym Rating'}</div>
        <button className="gcf-close" onClick={() => navigate('/gym-candy')} aria-label="Close">✕</button>
      </div>
      <div className="gcf-subtitle">
        {duping
          ? 'Copied from your last entry — tweak it and save as a new rating.'
          : "Rate your own session — or log a partner's feedback."}
      </div>

      <div className="gcf-scroll scrl">
        <Field label="Gym Name" required>
          <Select value={form.gym} onChange={(v) => set('gym', v)} options={GYMS} placeholder="Select your gym" />
        </Field>

        <Field label="Date">
          <input className="gcf-input" type="date" value={form.rated_on} onChange={(e) => set('rated_on', e.target.value)} />
        </Field>

        <Field label="Exercise Name" required>
          <input className="gcf-input" value={form.exercise_name} onChange={(e) => set('exercise_name', e.target.value)} placeholder="e.g. Barbell Back Squat" />
        </Field>

        <Field label="Today's Outfit">
          <input className="gcf-input" value={form.outfit} onChange={(e) => set('outfit', e.target.value)} placeholder="Describe your outfit" />
        </Field>

        {/* main ratings */}
        <RangeSlider label="Stance Rating" icon="🧍" value={form.stance} onChange={(v) => set('stance', v)} />
        <RangeSlider label="Form Rating" icon="🎯" value={form.form} onChange={(v) => set('form', v)} />
        <RangeSlider label="Effort Rating" icon="🔥" value={form.effort} onChange={(v) => set('effort', v)} />

        <div className="gcf-overall">
          <span>Overall</span>
          <span className="gcf-overall-score">{overall}<span>/100</span></span>
        </div>

        {/* self assessment */}
        {!showSelf ? (
          <button className="gcf-expand" onClick={() => setShowSelf(true)}>Self Assessment ⌄</button>
        ) : (
          <div className="gcf-self">
            <button className="gcf-expand open" onClick={() => setShowSelf(false)}>Self Assessment ⌃</button>

            <div className="gcf-two">
              <Field label={`Height${units === 'kg' ? ' (cm)' : ''}`}>
                {units === 'kg' ? (
                  <input className="gcf-input" type="number" inputMode="numeric" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} placeholder="cm" />
                ) : (
                  <div className="gcf-height">
                    <input className="gcf-input" type="number" inputMode="numeric" value={form.heightFt} onChange={(e) => set('heightFt', e.target.value)} placeholder="ft" />
                    <input className="gcf-input" type="number" inputMode="numeric" value={form.heightIn} onChange={(e) => set('heightIn', e.target.value)} placeholder="in" />
                  </div>
                )}
              </Field>
              <Field label={`Weight (${units})`}>
                <input className="gcf-input" type="number" inputMode="numeric" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder={units} />
              </Field>
            </div>

            <div className="gcf-self-label">Physique self-assessment</div>
            {BODY.map((b) => (
              <RangeSlider key={b.key} label={b.label} icon={<MuscleIcon muscle={b.muscle} size={16} />} value={form[b.key]} onChange={(v) => set(b.key, v)} />
            ))}

            <Field label="Notes">
              <textarea className="gcf-input gcf-textarea" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional notes…" />
            </Field>
          </div>
        )}
      </div>

      <div className="gcf-foot">
        <button className="gcf-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add Rating'}</button>
        <button className="gcf-cancel" onClick={() => navigate('/gym-candy')}>Cancel</button>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="gcf-field">
      <div className="gcf-field-label">{label} {required && <span className="gcf-req">*</span>}</div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="gcf-select-wrap">
      <select className={`gcf-select${value ? '' : ' empty'}`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="gcf-caret">⌄</span>
    </div>
  )
}
